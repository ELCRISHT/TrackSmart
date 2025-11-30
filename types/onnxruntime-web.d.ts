declare module 'onnxruntime-web' {
  export interface InferenceSession {
    run(feeds: any, options?: any): Promise<any>;
  }

  export interface Env {
    wasm: {
      wasmPaths: string;
    };
  }

  export class Tensor {
    constructor(
      type: string,
      data: any,
      dims: number[]
    );
  }

  export const env: Env;

  export class InferenceSession {
    static create(modelPath: string, options?: any): Promise<InferenceSession>;
  }

  export default {
    InferenceSession,
    Tensor,
    env,
  };
}

