import { FileBlockProps } from "@githubnext/blocks";
import { Label } from "@primer/react";
import { useEffect, useState } from "react";
import "./style.css"


const fileExtensionsMapping: { [key: string]: string } = {
  "puml": "plantuml",
  "dot": "graphviz",
  "gv": "graphviz",
  "c4": "c4plantuml",
  "c4puml": "c4plantuml",
  "er": "erd",
  "vg": "vega",
  "vgl": "vegalite",
  "vl": "vegalite"
}

class RequestError extends Error {

  constructor(message: string, public status: number) {
    super(message);
  }
}

export default function KrokiFileBlock(props: FileBlockProps) {
  const {content, context} = props
  const [base64Image, setBase64Image] = useState('');
  const [error, setError] = useState<RequestError | Error | undefined>(undefined);
  const fileExtension = context.file.split('.').pop() || ''
  const service = fileExtensionsMapping[fileExtension] || fileExtension

  useEffect(() => {
    ;(async () => {
      if (service) {
        try {
          setError(undefined)
          const response = await fetch(`https://kroki.io/${service}/svg`, {
            headers: {
              "Content-Type": "text/plain"
            },
            method: "POST",
            body: content
          })
          if (response.status === 200) {
            const arrayBuffer = await response.arrayBuffer();
            setBase64Image(`data:image/svg+xml;base64,${btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))}`)
          } else {
            setError(new RequestError('Unsuccessful request', response.status))
          }
        } catch (err) {
          setError(err as Error)
        }
      }
    })()
  }, [content])

  let errorMessage
  if (error instanceof RequestError) {
    if (error.status == 500) {
      errorMessage = "Something went wrong!"
    } else if (error.status == 400) {
      errorMessage = "Invalid syntax"
    } else if (error.status == 404) {
      errorMessage = "Unsupported diagram type"
    }
  } else if (error instanceof Error) {
    errorMessage = error.message
  }
  return (
    <>
      {errorMessage && <Label className={"label"} variant="attention">{errorMessage}</Label>}
      {base64Image && <img className={"diagram-image"} alt={service + " diagram"} src={base64Image}></img>}
      {!base64Image && <pre><code>{content}</code></pre>}
    </>
  );
}
