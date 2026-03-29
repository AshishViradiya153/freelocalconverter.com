declare module "heic-decode" {
  interface HeicDecodeResult {
    width: number;
    height: number;
    data: Uint8ClampedArray;
  }

  export default function decode(args: {
    buffer: Uint8Array;
  }): Promise<HeicDecodeResult>;
  export function all(args: { buffer: Uint8Array }): Promise<unknown>;
}
