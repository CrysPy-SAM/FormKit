export const defaultRedactPaths = [
    "req.headers.authorization",
    "req.headers.cookie",
    "req.cookies.access_token",
    "req.cookies.refresh_token",
    "res.headers['set-cookie']",
    "*.password",
    "*.token",
    "*.jwt",
    "*.secret",
];