/** A File is a single file in an archive. */
export type TxtArFile = {
    name: string;
    data: string;
}

/** An Archive is a collection of files. */
export type TxtAr = {
    comment: string;
    files: TxtArFile[];
}

/**
 * Format returns the serialized form of a TxtAr.
 * It is assumed that the TxtAr data structure is well-formed:
 * a.Comment and all a.File[i].Data contain no file marker lines,
 * and all a.File[i].Name is non-empty.
 * @param a The TxtAr to serialize.
 * @returns The serialized form of a TxtAr.
 */
export function format(a: TxtAr): string {
    let b = fixNL(a.comment);
    a.files.forEach(f => {
        b += `-- ${f.name} --\n`;
        b += fixNL(f.data);
    })
    return b;
}

// Parse parses the serialized form of an Archive.
// The returned Archive holds slices of data.
export function parse(data: string): TxtAr {
    // console.log(`Parsing data: ${data}>>>>`);
    const files: TxtArFile[] = [];

    let {
        before: comment,
        name,
        after
    } = findFileMarker(data);
    // console.log(`Found first file '${name}'`);

    while (name != "") {
        const {
            before: fileData,
            name: nextFileName,
            after: nextAfter
        } = findFileMarker(after);
        // console.log(`Found next file '${nextFileName}'`);

        files.push({
            name,
            data: fileData
        });

        name = nextFileName;
        after = nextAfter;
        // console.log(`Shifting space to:${after}>>>`)
    }

    return {
        comment,
        files
    }
}

const MARKER = "-- ";
const MARKER_END = " --";
const NEWLINE_MARKER = "\n-- ";

type Marker = { name: string, after: string };

// findFileMarker finds the next file marker in data,
// extracts the file name, and returns the data before the marker,
// the file name, and the data after the marker.
// If there is no next marker, findFileMarker returns before = fixNL(data), name = "", after = nil.
function findFileMarker(data: string): Marker & { before: string } {
    let i = 0;
    while (true) {
        const tail = data.slice(i);
        const m = isMarker(tail);
        if (m) {
            // console.log("Found marker:", m);
            return {
                ...m,
                before: data.slice(0, i)
            }
        }
        const j = tail.indexOf(NEWLINE_MARKER);
        if (j < 0) {
            // console.log("Could not find another marker in remainder of data.");
            return {
                before: fixNL(data),
                name: "",
                after: ""
            }
        }
        i += j + 1;
    }
}

/**
 * isMarker checks whether data begins with a file marker line.
 * If so, it returns the name from the line and the data after the line.
 * Otherwise it returns name == "" with an unspecified after.
 */
function isMarker(data: string): { name: string, after: string } | null {
    if (!data.startsWith(MARKER)) {
        return null;
    }
    const i = data.indexOf("\n");
    const line = i > 0 ? data.slice(0, i) : data;
    const after = i > 0 ? data.slice(i + 1) : "";
    if (!line.endsWith(MARKER_END) || line.length < MARKER.length + MARKER_END.length) {
        return null;
    }

    const name = line.slice(MARKER.length, -MARKER_END.length).trim();
    if (name === "") {
        return null
    }

    return {
        name,
        after
    }
}

/**
 * If data is empty or ends in \n, fixNL returns data.
 * Otherwise fixNL returns a new slice consisting of data with a final \n added.
*/
function fixNL(data: string): string {
    if (data === "" || data.endsWith("\n")) {
        return data
    }
    return data + "\n"
}

// @ts-ignore
export async function fuzz(data) {
    const fuzzerData = data.toString();
    const ar = parse(fuzzerData);
    const formatted = format(ar);

    const exReq = await fetch("http://0.0.0.0:4000", {
        method: "POST",
        body: fuzzerData
    });
    const exOut = await exReq.text();

    const goReq = await fetch("http://0.0.0.0:52514", {
        method: "POST",
        body: fuzzerData
    });
    const goOut = await goReq.text();

    if (formatted !== exOut || formatted !== goOut || exOut !== goOut) {
        console.log(`IN (${fuzzerData.length}):\n${fuzzerData}>>>>`);
        console.log(`JS (${formatted.length}):\n${formatted}>>>>`);
        console.log(`GO (${goOut.length}):\n${goOut}>>>>`);
        console.log(`EX (${exOut.length}):\n${exOut}>>>>`);
        throw "uh oh!";
    }
};
