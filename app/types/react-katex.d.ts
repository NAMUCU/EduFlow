declare module 'react-katex' {
  import { ComponentType, HTMLAttributes } from 'react'

  interface MathProps extends HTMLAttributes<HTMLSpanElement> {
    math?: string
    children?: string
    errorColor?: string
    renderError?: (error: Error) => React.ReactNode
  }

  export const InlineMath: ComponentType<MathProps>
  export const BlockMath: ComponentType<MathProps>
}
