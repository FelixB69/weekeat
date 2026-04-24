import { Suspense } from "react";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Créer un compte" };

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
