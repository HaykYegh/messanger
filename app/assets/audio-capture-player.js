class ZangiWorkletProcessor extends AudioWorkletProcessor {
    constructor(options) {

        super();

        this._bufferSize = sampleRate / 50;
        this._buffer = new Float32Array(this._bufferSize);
        this._initBuffer();

        this.playerBufferIndex = 0;
        this.port.onmessage = (e) => {
            if (e.data.eventType === 'stop') {
                this.stoped = true;
                return;
            }
            if (this.playerBuffer) {
                this.playerBufferNext = new Float32Array(e.data.buffer.buffer);
            } else {
                this.playerBuffer =  new Float32Array(e.data.buffer.buffer);
                this.port.postMessage({eventType:'get'});
            }
        };
    }

    _initBuffer() {
        this._bytesWritten = 0;
    }

    _isBufferEmpty() {
        return this._bytesWritten === 0;
    }

    _isBufferFull() {
        return this._bytesWritten === this._bufferSize;
    }

    _appendToBuffer(value) {

        if (this._isBufferFull()) {
            this._flush();
        }

        this._buffer[this._bytesWritten] = value;
        this._bytesWritten += 1;
    }

    _flush() {
        let buffer = this._buffer;
        if (this._bytesWritten < this._bufferSize) {
            buffer = buffer.slice(0, this._bytesWritten);
        }
        this.port.postMessage({
            eventType: 'data',
            audioBuffer: buffer
        });

        this._initBuffer();
    }

    process(inputs, outputs, parameters) {
        if (this.stoped) {
            return false;
        }
        const isCapturingValues = parameters.isCapturing;

        const inputChannel = inputs[0][0];
        for (
            let dataIndex = 0;
            dataIndex < inputChannel.length;
            dataIndex++
        ) {
            const shouldRecord = isCapturingValues.length > 1 ? isCapturingValues[dataIndex] === 1 : isCapturingValues[0] === 1;
            if (shouldRecord) {
                // console.log("shouldRecord -> ", shouldRecord)
                this._appendToBuffer(inputChannel[dataIndex]);
            }
        }

        if (!this.playerBuffer) {
            this.port.postMessage({eventType:'get'});
            return true;
        }
        const outputChannel = outputs[0][0];
        for (
            let dataIndex = 0;
            dataIndex < outputChannel.length;
            dataIndex++
        ) {
            const shouldRecord = true;


            if (shouldRecord) {
                outputChannel[dataIndex] = this.playerBuffer[this.playerBufferIndex];
                this.playerBufferIndex = this.playerBufferIndex + 1;
                if (this.playerBufferIndex >= this.playerBuffer.length) {
                    this.playerBuffer = this.playerBufferNext;
                    this.playerBufferIndex = 0;
                    this.playerBufferNext = null;
                    this.port.postMessage({eventType:'get'});
                    if (!this.playerBuffer) {

                        return true;
                    }
                }
            }
        }

        return true;
    }
    static get parameterDescriptors () {
        return [{
            name: 'isCapturing',
            defaultValue: 1
        }]
    }
};


registerProcessor('zangi-worklet', ZangiWorkletProcessor);
