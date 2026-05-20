interface Navigator {
    gpu: {
      requestAdapter: (options?: any) => Promise<any>;
    };
  }