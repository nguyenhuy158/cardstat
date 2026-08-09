export function resolveBaseUrl(args, flag = "--url") {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : process.env.UPLOAD_URL || "http://localhost:3000";
}
