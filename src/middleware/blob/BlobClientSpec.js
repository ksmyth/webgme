/**
 * @author ksmyth / https://github.com/ksmyth
 */

'use strict';
if (typeof window === 'undefined') {
    // server-side setup
    var requirejs = require('requirejs');
    require('../../../../../test-conf.js');

    var chai = require('chai'),
        should = chai.should(),
        assert = chai.assert,
        expect = chai.expect;
}

describe('BlobClient', function () {
    var BlobClient;
    var Artifact;
    before(function (done) {
        requirejs(['blob/BlobClient', 'blob/Artifact'], function (BlobClient_, Artifact_) {
            BlobClient = BlobClient_;
            Artifact = Artifact_;
            done();
        });
    });

    it('should have putFile', function () {
        var bc = new BlobClient();
        expect(bc.__proto__.hasOwnProperty("putFile")).to.equal(true);
    });

    it('should create json', function (done) {
        var bc = new BlobClient();

        bc.putFile("test.json", str2ab('{"1":2}'), function(err, hash) {
            if (err)
                done(err);
            bc.getMetadata(hash, function(err, metadata) {
                if (err)
                    done(err);
                expect(metadata.mime).to.equal('application/json');
                bc.getObject(hash, function(err, res) {
                    if (err)
                        done(err);
                    expect(typeof res).to.equal('object');
                    expect(typeof res.prototype).to.equal('undefined');
                    expect(res[1]).to.equal(2);
                    done();
                });
            });
        });
    });

    function createZip(data, done) {
        var bc = new BlobClient();
        bc.putFile("testzip.zip", data, function(err, hash) {
            if (err)
                done(err);
            bc.getMetadata(hash, function(err, metadata) {
                if (err)
                    done(err);
                expect(metadata.mime).to.equal('application/zip');
                bc.getObject(hash, function(err, res) {
                    if (err)
                        done(err);
                    expect(res instanceof ArrayBuffer).to.equal(true);
                    var data2 = Array.apply([], new Uint8Array(res));
                    expect(data.length).to.equal(data2.length);
                    for (var i = 0; i < data.length; ++i) {
                        expect(data[i]).to.equal(data2[i]);
                    }
                    done();
                });
            });
        });
    }

    it('should create zip', function (done) {
        var data = base64DecToArr("UEsDBAoAAAAAACNaNkWtbMPDBwAAAAcAAAAIAAAAZGF0YS5iaW5kYXRhIA0KUEsBAj8ACgAAAAAA\n" +
            "I1o2Ra1sw8MHAAAABwAAAAgAJAAAAAAAAAAgAAAAAAAAAGRhdGEuYmluCgAgAAAAAAABABgAn3xF\n" +
            "poDWzwGOVUWmgNbPAY5VRaaA1s8BUEsFBgAAAAABAAEAWgAAAC0AAAAAAA==");
        createZip(data, done);
    });

    if (typeof global !== 'undefined') { // i.e. if running under node-webkit
        // need this in package.json: "node-remote": "localhost"
        it('should create zip from node-webkit Buffer', function (done) {
            var data = base64DecToArr("UEsDBAoAAAAAACNaNkWtbMPDBwAAAAcAAAAIAAAAZGF0YS5iaW5kYXRhIA0KUEsBAj8ACgAAAAAA\n" +
                "I1o2Ra1sw8MHAAAABwAAAAgAJAAAAAAAAAAgAAAAAAAAAGRhdGEuYmluCgAgAAAAAAABABgAn3xF\n" +
                "poDWzwGOVUWmgNbPAY5VRaaA1s8BUEsFBgAAAAABAAEAWgAAAC0AAAAAAA==");
            createZip(new Buffer(data), done);
        });
    }

    it('should create metadata', function (done) {
        var artifact = new Artifact('testartifact', new BlobClient());
        artifact.addFiles({'file1': 'content1', 'file2': 'content2'}, function (err, hashes) {
            if (err)
                done(err);
            expect(Object.keys(hashes).length).to.equal(2);
            
            done();
        });
    });


    // https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
    function b64ToUint6 (nChr) {
        return nChr > 64 && nChr < 91 ?
            nChr - 65
            : nChr > 96 && nChr < 123 ?
            nChr - 71
            : nChr > 47 && nChr < 58 ?
            nChr + 4
            : nChr === 43 ?
            62
            : nChr === 47 ?
            63
            :
            0;
    }

    function base64DecToArr (sBase64, nBlocksSize) {
        var
            sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
            nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);

        for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
            nMod4 = nInIdx & 3;
            nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
            if (nMod4 === 3 || nInLen - nInIdx === 1) {
                for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
                    taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
                }
                nUint24 = 0;

            }
        }
        return taBytes;
    }

    function str2ab(str) {
        var buf = new ArrayBuffer(str.length);
        var bufView = new Uint8Array(buf);
        for (var i=0, strLen=str.length; i<strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }
});
