"use client"

type GjsRendererProps = {
  html: string
  css: string
}

export function GjsRenderer({ html, css }: GjsRendererProps) {
  return (
    <>
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </>
  )
}
