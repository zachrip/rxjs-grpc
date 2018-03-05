"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var grpc = require("grpc");
require("rxjs/add/observable/of");
require("rxjs/add/operator/map");
var Observable_1 = require("rxjs/Observable");
var utils_1 = require("./utils");
function serverBuilder(protoPath, packageName) {
    var server = new grpc.Server();
    var builder = {
        start: function (address, credentials) {
            server.bind(address, credentials || grpc.ServerCredentials.createInsecure());
            server.start();
        },
        forceShutdown: function () {
            server.forceShutdown();
        }
    };
    var pkg = utils_1.lookupPackage(grpc.load(protoPath), packageName);
    var _loop_1 = function (name_1) {
        builder["add" + name_1] = function (rxImpl) {
            server.addProtoService(pkg[name_1].service, createService(pkg[name_1], rxImpl));
            return this;
        };
    };
    for (var _i = 0, _a = getServiceNames(pkg); _i < _a.length; _i++) {
        var name_1 = _a[_i];
        _loop_1(name_1);
    }
    return builder;
}
exports.serverBuilder = serverBuilder;
function createService(Service, rxImpl) {
    var service = {};
    for (var name_2 in Service.prototype) {
        if (typeof rxImpl[name_2] === 'function') {
            service[name_2] = createMethod(rxImpl, name_2, Service.prototype);
        }
    }
    return service;
}
function createMethod(rxImpl, name, serviceMethods) {
    return function (call, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var serviceMethod, observable, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        serviceMethod = serviceMethods[name];
                        observable = Observable_1.Observable.of(call.request);
                        if (serviceMethod.requestStream) {
                            observable = new Observable_1.Observable(function (observer) {
                                call.on('data', function (data) {
                                    observer.next(data);
                                });
                                call.on('cancelled', function () {
                                    observer.error();
                                });
                                call.on('end', function () {
                                    observer.complete();
                                });
                            });
                        }
                        response = rxImpl[name](observable, call.metadata);
                        if (!serviceMethod.responseStream) return [3 /*break*/, 2];
                        return [4 /*yield*/, response.forEach(function (data) { return call.write(data); })];
                    case 1:
                        _a.sent();
                        call.end();
                        return [3 /*break*/, 3];
                    case 2:
                        response.subscribe(function (data) { return callback(null, data); }, function (error) { return callback(error); });
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
}
function clientFactory(protoPath, packageName) {
    var Constructor = /** @class */ (function () {
        function Constructor(address, credentials, options) {
            if (options === void 0) { options = undefined; }
            this.__args = [
                address,
                credentials || grpc.credentials.createInsecure(),
                options
            ];
        }
        return Constructor;
    }());
    var prototype = Constructor.prototype;
    var pkg = utils_1.lookupPackage(grpc.load(protoPath), packageName);
    var _loop_2 = function (name_3) {
        prototype["get" + name_3] = function () {
            return createServiceClient(pkg[name_3], this.__args);
        };
    };
    for (var _i = 0, _a = getServiceNames(pkg); _i < _a.length; _i++) {
        var name_3 = _a[_i];
        _loop_2(name_3);
    }
    return Constructor;
}
exports.clientFactory = clientFactory;
function getServiceNames(pkg) {
    return Object.keys(pkg).filter(function (name) { return pkg[name].service; });
}
function createServiceClient(GrpcClient, args) {
    var grpcClient = new (GrpcClient.bind.apply(GrpcClient, [void 0].concat(args)))();
    var rxClient = {};
    for (var _i = 0, _a = Object.keys(GrpcClient.prototype); _i < _a.length; _i++) {
        var name_4 = _a[_i];
        rxClient[name_4] = createClientMethod(grpcClient, name_4);
    }
    return rxClient;
}
function createClientMethod(grpcClient, name) {
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var clientMethod = grpcClient[name];
        return new Observable_1.Observable(function (observer) {
            var handler = function (error, data) {
                if (error) {
                    observer.error(error);
                }
                else {
                    observer.next(data);
                }
                observer.complete();
            };
            var call;
            var actualHandler = clientMethod.responseStream ? undefined : handler;
            if (clientMethod.requestStream) {
                call = clientMethod.call(grpcClient, actualHandler);
            }
            else {
                call = clientMethod.apply(grpcClient, args.concat([actualHandler]));
            }
            if (clientMethod.responseStream) {
                call.on('data', function (data) { return observer.next(data); });
                call.on('error', function (error) { return observer.error(error); });
                call.on('end', function () { return observer.complete(); });
            }
            if (clientMethod.requestStream) {
                var observable = args[0];
                observable.subscribe(function (value) {
                    call.write(value);
                }, function (error) {
                    call.cancel();
                }, function () {
                    call.end();
                });
            }
        });
    };
}
//# sourceMappingURL=index.js.map