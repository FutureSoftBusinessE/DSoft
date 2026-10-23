import { useEffect, useState } from "react"

export default function VersionBadge() {
  const [info, setInfo] = useState(null)

  useEffect(() => {
    fetch("/version.txt?t=" + Date.now())
      .then((r) => (r.ok ? r.text() : null))
      .then((text) => {
        if (!text) return
        const data = {}
        text.split("\n").forEach((line) => {
          const [k, ...v] = line.split("=")
          if (k) data[k.trim()] = v.join("=").trim()
        })
        setInfo(data)
      })
      .catch(() => {})
  }, [])

  if (!info?.commit) return null

  return (
    <div className="version-badge" style={{ fontSize: "11px", color: "#888", lineHeight: 1.4 }}>
      <div>{info.commit}</div>
      <div>{info.build ? info.build.slice(0, 19).replace("T", " ") : ""}</div>
    </div>
  )
}
