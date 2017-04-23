import {
  FileSystemRequest,
  FileSystemResponse
} from '.'

type MakeParamName<Params> = (arg: any) => keyof Params | undefined
type ParamsNameMakers<Params> = (keyof Params | MakeParamName<Params>)[]

const makeMethod = <Params>(method: string,
  paramNameMakers: ParamsNameMakers<Params> = []
) => (...args: any[]) => ({
  method, args,
  params: paramNameMakers
    .reduce((params, paramMaker: string | MakeParamName<Params>, i) => {
      const param = typeof paramMaker === 'function' ?
        paramMaker(args[i]) : paramMaker as string
      return Object.assign(params, param ? { [param]: args[i] } : {})
    }, {})
})

export interface CopyFilterFunction {
  (src: string): boolean
}

export type CopyFilter = CopyFilterFunction | RegExp;

// copy

export interface CopyOptions {
  clobber?: boolean
  preserveTimestamps?: boolean
  dereference?: boolean
  filter?: CopyFilter
  recursive?: boolean
}

export interface CopyParams {
  src: string,
  dest: string
  filter?: CopyFilter
  options?: CopyOptions
}

export type CopyRequest = FileSystemRequest & { params: CopyParams }

export interface Copy {
  (src: string, dest: string): CopyRequest
  (src: string, dest: string, filter: CopyFilter): CopyRequest
  (src: string, dest: string, options: CopyOptions): CopyRequest
}

const getCopyOptionalParamName = (arg: any) =>
  typeof arg === 'function' || arg instanceof RegExp ? 'filter' :
    (typeof arg === 'object' ? 'options' : undefined)

export const copy =
  makeMethod<CopyParams>('copy', ['src', 'dest', getCopyOptionalParamName]) as Copy

// move

export interface MoveOptions {
  clobber?: boolean;
  limit?: number;
}

export interface MoveParams {
  src: string,
  dest: string
  options?: MoveOptions
}

export type MoveRequest = FileSystemRequest & { params: MoveParams }

export interface Move {
  (src: string, dest: string): MoveRequest
  (src: string, dest: string, options: MoveOptions): MoveRequest
}

export const move = makeMethod<MoveParams>('move', ['src', 'dest', 'options']) as Move

// remove

export interface RemoveParams {
  path: string,
}

export type RemoveRequest = FileSystemRequest & { params: RemoveParams }

export interface Remove {
  (path: string): RemoveRequest
}

/*
  Removes a file or directory. The directory can have contents. Like rm -rf.
**/
export const remove = makeMethod<RemoveParams>('remove', ['path']) as Remove

// export declare function removeSync(dir: string): void;

// export interface OpenOptions {
//   encoding?: string;
//   flag?: string;
// }

// export interface MkdirOptions {
//   fs?: any;
//   mode?: number;
// }


// export declare function createFileSync(file: string): void;

// export declare function mkdirsSync(dir: string, options?: MkdirOptions): void;
// export declare function mkdirpSync(dir: string, options?: MkdirOptions): void;

// export declare function outputFileSync(file: string, data: any): void;

// export declare function outputJsonSync(file: string, data: any): void;
// export declare function outputJSONSync(file: string, data: any): void;

// export declare function readJsonSync(file: string, options?: OpenOptions): any;

// export declare function removeSync(dir: string): void;

// export declare function writeJsonSync(file: string, object: any, options?: OpenOptions): void;

// export declare function ensureDirSync(path: string): void;

// export declare function ensureFileSync(path: string): void;

// export declare function ensureLinkSync(path: string): void;

// export declare function ensureSymlinkSync(path: string): void;

// export declare function emptyDirSync(path: string): boolean;




// fs 

// export function readFileSync(filename: string, encoding: string): string;
// export function readFileSync(filename: string, options: { encoding: string; flag?: string; }): string;
// export function readFileSync(filename: string, options?: { flag?: string; }): Buffer;

// export function readFileSync(filename: string, options?: { flag?: string; }): Buffer;
// export function writeFileSync(filename: string, data: any, options?: { encoding?: string; mode?: number; flag?: string; }): void;
// export function writeFileSync(filename: string, data: any, options?: { encoding?: string; mode?: string; flag?: string; }): void;

// export function appendFileSync(filename: string, data: any, options?: { encoding?: string; mode?: number; flag?: string; }): void;
// export function appendFileSync(filename: string, data: any, options?: { encoding?: string; mode?: string; flag?: string; }): void;


// export function accessSync(path: string | Buffer, mode?: number): void;