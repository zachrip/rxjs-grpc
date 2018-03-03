"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var ts = require("typescript");
function compileInMemory(sources) {
    var options = {
        noEmitOnError: true,
        noImplicitAny: true,
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS,
        noLib: false,
        lib: ['lib.es6.d.ts']
    };
    var compilerHost = createCompilerHost(sources, options);
    var program = ts.createProgram(Object.keys(sources), options, compilerHost);
    var emitResult = program.emit(undefined, function () { });
    return {
        ok: !emitResult.emitSkipped,
        errors: extractErrors(emitResult, program)
    };
}
exports.compileInMemory = compileInMemory;
function createCompilerHost(sources, options) {
    var compilerHost = ts.createCompilerHost(options);
    compilerHost.getSourceFile = function (fileName, version) {
        var sourceText;
        if (fileName in sources) {
            sourceText = sources[fileName];
        }
        else {
            sourceText = ts.sys.readFile(fileName);
        }
        return ts.createSourceFile(fileName, sourceText, version);
    };
    compilerHost.resolveModuleNames = function (moduleNames, containingFile) {
        var _this = this;
        return moduleNames.map(function (moduleName) {
            if (moduleName === 'rxjs-grpc') {
                return {
                    resolvedFileName: path.join(__dirname, '..', 'index.d.ts')
                };
            }
            else if (moduleName === './grpc-namespaces') {
                return {
                    resolvedFileName: 'grpc-namespaces.ts'
                };
            }
            else {
                var result = ts.resolveModuleName(moduleName, containingFile, options, _this);
                return result.resolvedModule;
            }
        });
    };
    return compilerHost;
}
function extractErrors(emitResult, program) {
    var allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
    return allDiagnostics.map(function (diagnostic) {
        var prefix = '';
        if (diagnostic.file) {
            var _a = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start), line = _a.line, character = _a.character;
            prefix = diagnostic.file.fileName + " (" + (line + 1) + "," + (character + 1) + "): ";
        }
        var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        return "" + prefix + message;
    });
}
//# sourceMappingURL=utils.js.map