"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function lookupPackage(root, packageName) {
    var pkg = root;
    for (var _i = 0, _a = packageName.split(/\./); _i < _a.length; _i++) {
        var name_1 = _a[_i];
        pkg = pkg[name_1];
    }
    return pkg;
}
exports.lookupPackage = lookupPackage;
//# sourceMappingURL=utils.js.map