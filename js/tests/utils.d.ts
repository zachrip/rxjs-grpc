export declare type Sources = {
    [name: string]: string;
};
export declare type CompileResult = {
    ok: boolean;
    errors: string[];
};
export declare function compileInMemory(sources: Sources): {
    ok: boolean;
    errors: string[];
};
