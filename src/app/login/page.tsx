import { LoginForm } from "@/components/auth/LoginForm";
import { LoginGuard } from "@/components/auth/AuthGuard";

export default function LoginPage() {
  return (
    <LoginGuard>
      <LoginForm />
    </LoginGuard>
  );
}
