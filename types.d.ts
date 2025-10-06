declare const __REPO__: string

declare module '*.yml' {
  const value: { [key: string]: any }
  export default value
}
