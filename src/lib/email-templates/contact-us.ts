export function contactUs({ subject, content }: { content: string; subject: string }) {
  return `
  <html>
  <h1>${subject}</h1>
    <div>
      <p>${content}</p>
    </div>
  </html>
  `
}
