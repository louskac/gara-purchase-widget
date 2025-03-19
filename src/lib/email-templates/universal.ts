export function universal({ data }: { data: { [key: string]: any } }) {
  return `
  <html>
  <table>
  <tbody>
${Object.keys(data)
  .map((key) => {
    return `
    <tr>
      <td>${key}</td>
      <td>${data[key]}</td>
    </tr>
    `
  })
  .join("")}
  </tbody>
  </table>
  </html>
  `
}
