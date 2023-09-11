/** A File is a single file in an archive. */
export type TxtArFile = {
    name: string;
    data: string;
};
/** An Archive is a collection of files. */
export type TxtAr = {
    comment: string;
    files: TxtArFile[];
};
/**
 * Format returns the serialized form of a TxtAr.
 * It is assumed that the TxtAr data structure is well-formed:
 * a.Comment and all a.File[i].Data contain no file marker lines,
 * and all a.File[i].Name is non-empty.
 * @param a The TxtAr to serialize.
 * @returns The serialized form of a TxtAr.
 */
export declare function format(a: TxtAr): string;
export declare function parse(data: string): TxtAr;
export declare function fuzz(data: any): Promise<void>;
