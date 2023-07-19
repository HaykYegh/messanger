import Log from "modules/messages/Log";

const hasBlobConstructor = typeof (Blob) !== 'undefined' && (function () {
    try {
        return Boolean(new Blob());
    } catch (e) {
        return false;
    }
}());

const hasArrayBufferViewSupport = hasBlobConstructor && typeof (Uint8Array) !== 'undefined' && (function () {
    try {
        return new Blob([new Uint8Array(100)]).size === 100;
    } catch (e) {
        return false;
    }
}());

const hasToBlobSupport = (typeof HTMLCanvasElement !== 'undefined' ? HTMLCanvasElement.prototype.toBlob : false);

const hasBlobSupport = (hasToBlobSupport ||
    (typeof Uint8Array !== 'undefined' && typeof ArrayBuffer !== 'undefined' && typeof atob !== 'undefined'));

const hasReaderSupport = (typeof FileReader !== 'undefined' || typeof URL !== 'undefined');

export class ImageManager {

    static optimalSize ({toSaveWidth, toSaveHeight, maxWidth, maxHeight, originalWidth, originalHeight, video}) {
        if (originalWidth > 0 && originalHeight > 0 && originalWidth / toSaveWidth > originalHeight / toSaveHeight) {

            toSaveWidth = Math.floor(toSaveHeight * originalWidth / originalHeight);

            if (toSaveWidth > maxWidth) {
                toSaveWidth = maxWidth
                toSaveHeight = Math.floor(maxWidth * originalHeight / originalWidth);
            }
        } else if (originalWidth > 0 && originalHeight > 0) {
            toSaveHeight = Math.floor(toSaveWidth * originalHeight / originalWidth);
            if (toSaveHeight > maxHeight) {
                toSaveHeight = maxHeight
                toSaveWidth = Math.floor(maxHeight * originalWidth / originalHeight);
            }
        } else if (video && video.videoWidth && video.videoHeight && video.videoWidth > 0 && video.videoHeight > 0) {
            toSaveWidth = Math.floor(toSaveHeight * originalWidth / originalHeight);
            if (toSaveWidth > maxWidth) {
                toSaveWidth = maxWidth
                toSaveHeight = Math.floor(maxWidth * originalHeight / originalWidth);
            }
        }

        return {width: toSaveWidth, height: toSaveHeight}
    }

    static resize(file: File, maxDimensions: { width: number, height: number, isFlex: boolean, keepOriginal?: boolean}, callback) {
        if (typeof maxDimensions === 'function') {
            callback = maxDimensions;
            maxDimensions = {
                width: 640,
                height: 480,
                keepOriginal: false,
                isFlex: false
            };
        }


        if (!ImageManager.isSupported()) { //|| !file.type.match(/image.*/)
            callback(file, false);
            return false;
        }

        if (file && file.type.match(/image\/gif/) && maxDimensions.keepOriginal) {
            // Not attempting, could be an animated gif
            callback(file, false);
            // TODO: use https://github.com/antimatter15/whammy to convert gif to webm
            return false;
        }

        const image = document.createElement('img');

        image.onload = (imgEvt) => {
            let width = image.width;
            let height = image.height;
            let isTooLarge = false;

            if (width >= height && width > maxDimensions.width) {
                isTooLarge = true;
            } else if (height > maxDimensions.height) {
                isTooLarge = true;
            }

            if (!isTooLarge && file.size < 45000 && file && !file.type.match(/image\/gif/)) {
                // early exit; no need to resize
                callback(file, {width: image.width, height: image.height});
                return;
            }

            const scaleRatio = maxDimensions.width / width;

            // TODO number of resampling steps
            // const steps = Math.ceil(Math.log(width / (width * scaleRatio)) / Math.log(2));

            width *= scaleRatio;
            height *= scaleRatio;

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            (ctx as any).imageSmoothingQuality = 'high';
            if(maxDimensions.isFlex){
                const maxPixelCount = maxDimensions.width * maxDimensions.height;
                let widthRatio = 1;
                let heightRatio = 1;
                //1.777 is for 16:9 relation
                if(image.width > 0 && image.height > 0 && (image.height/image.width < 1.777 && image.width/image.height < 1.777 || maxDimensions.keepOriginal)){
                    const ratio = image.width/image.height;
                    maxDimensions.height = Math.ceil(Math.sqrt(maxPixelCount/ratio));
                    maxDimensions.width = Math.ceil(maxDimensions.height * ratio);
                } else if(image.width > 0 && image.height > 0){
                    if(image.width/image.height >= 1.777){
                        maxDimensions.height = Math.ceil(Math.sqrt(maxPixelCount/1.777));
                        maxDimensions.width = Math.ceil(maxDimensions.height * 1.777);
                    } else {
                        maxDimensions.width = Math.ceil(Math.sqrt(maxPixelCount/1.777));
                        maxDimensions.height = Math.ceil(maxDimensions.width * 1.777);
                    }

                    if(image.width > 0 && image.height > 0 && image.width/maxDimensions.width > image.height/maxDimensions.height){
                        widthRatio = (image.height * maxDimensions.width)/(maxDimensions.height * image.width);
                    }else if(image.width > 0 && image.height > 0){
                        heightRatio = (maxDimensions.height * image.width)/(image.height * maxDimensions.width);
                    }
                }

                canvas.width = maxDimensions.width;
                canvas.height = maxDimensions.height;
                ctx.imageSmoothingEnabled = true;
                // @ts-ignore
                ctx.imageSmoothingQuality = "high";
                ctx.drawImage(image, (image.width - image.width * widthRatio) / 2, (image.height - image.height * heightRatio) / 2, image.width * widthRatio, image.height * heightRatio, 0, 0, canvas.width, canvas.height);
            } else {
                ctx.drawImage(image, 0, 0, width, height);
            }

            if (hasToBlobSupport) {
                canvas.toBlob((blob) => {
                    if(blob.size > 40000 && !maxDimensions.keepOriginal){
                        canvas.toBlob((blob) => {
                            callback(blob, {width:canvas.width, height: canvas.height});
                        }, 'image/jpeg', blob.size > 45000 ? 0.5 : 0.6);
                    }else{
                        callback(blob, {width:canvas.width, height: canvas.height});
                    }
                }, 'image/jpeg', maxDimensions.keepOriginal ? 1 : 0.8);
            } else {
                const blob = ImageManager._toBlob(canvas, file.type);
                callback(blob, {width:canvas.width, height: canvas.height});
            }
        };
        image.onerror = () => {
            callback(file, false);
            return false;
        }

        ImageManager._loadImage(image, file);

        return true;
    }

    static _toBlob(canvas, type) {
        const dataURI = canvas.toDataURL(type);
        const dataURIParts = dataURI.split(',');
        let byteString;
        if (dataURIParts[0].indexOf('base64') >= 0) {
            // Convert base64 to raw binary data held in a string:
            byteString = atob(dataURIParts[1]);
        } else {
            // Convert base64/URLEncoded data component to raw binary data:
            byteString = decodeURIComponent(dataURIParts[1]);
        }
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const intArray = new Uint8Array(arrayBuffer);

        for (let i = 0; i < byteString.length; i += 1) {
            intArray[i] = byteString.charCodeAt(i);
        }

        const mimeString = dataURIParts[0].split(':')[1].split(';')[0];
        let blob = null;

        if (hasBlobConstructor) {
            blob = new Blob(
                [hasArrayBufferViewSupport ? intArray : arrayBuffer],
                {type: mimeString}
            );
        } else {
            blob = new Blob([arrayBuffer]);
        }
        return blob;
    }

    static _loadImage(image, file, callback?: any) {
        if (typeof (URL) === 'undefined') {
            const reader = new FileReader();
            reader.onload = function (evt) {
                image.src = (evt.target as any).result;
                if (callback) {
                    callback();
                }
            };
            reader.readAsDataURL(file);
        } else {
            image.src = URL.createObjectURL(file);
            if (callback) {
                callback();
            }
        }
    };

    static _toFile = (theBlob: Blob, fileName: string): File => {
        const b: any = theBlob;
        b.lastModifiedDate = new Date();
        b.name = fileName;
        return <File>theBlob;
    };

    static isSupported() {
        return (
            (typeof (HTMLCanvasElement) !== 'undefined')
            && hasBlobSupport
            && hasReaderSupport
        );
    }
}
