const jwt = require('jsonwebtoken');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbl9yb290IiwidXNlcl9pZCI6ImFkbWluX3Jvb3QiLCJlbWFpbCI6ImFkbWluQG5lcm1haS5pbnRlcm5hbCIsIm5hbWUiOiJTeXN0ZW0gQWRtaW4iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJ0ZW5hbnRJZCI6ImRlZmF1bHRfdGVuYW50IiwiaXNBZG1pbiI6dHJ1ZSwiaWF0IjoxNzg0MDAyMTcxLCJleHAiOjE3ODQwNDUzNzF9.hOkBee5VRK2va04djCYryf8j8EfdnNUa3DSa3b4EsbY";

const SECRET = 'supersecret123';

try {
  const decoded = jwt.verify(token, SECRET);
  console.log("Decoded successfully:", decoded);
} catch (e) {
  console.error("Verification failed:", e);
}
