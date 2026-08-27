declare function acquireVsCodeApi(): {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
};

const vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : {
  postMessage: (msg: any) => console.log('Mock postMessage:', msg),
  getState: () => ({}),
  setState: () => {},
};

export function useVsCodeApi() {
  return vscode;
}
