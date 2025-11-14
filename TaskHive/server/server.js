import { app } from "./app.js";

//brings in the app instance from app.js
//listen starts the server on the specified port
app.listen(process.env.PORT, () => {
  console.log(`Server is working on ${process.env.PORT}`);
});
