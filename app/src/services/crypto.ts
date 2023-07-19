import Log from "modules/messages/Log";

const libsignal = (window as any).libsignal;


const KeyHelper = libsignal.KeyHelper;


export const registrationId = KeyHelper.generateRegistrationId();
// Store registrationId somewhere durable and safe.

KeyHelper.generateIdentityKeyPair().then((identityKeyPair) => {

    Log.i(identityKeyPair);


    // keyPair -> { pubKey: ArrayBuffer, privKey: ArrayBuffer }
    // Store identityKeyPair somewhere durable and safe.
});

// KeyHelper.generatePreKey(keyId).then(function(preKey) {
//     store.storePreKey(preKey.keyId, preKey.keyPair);
// });
//
// KeyHelper.generateSignedPreKey(identityKeyPair, keyId).then(function(signedPreKey) {
//     store.storeSignedPreKey(signedPreKey.keyId, signedPreKey.keyPair);
// });
