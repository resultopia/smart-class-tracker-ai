
import { useState } from "react";
import { useSupabaseAuth } from "@/lib/supabase-auth";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const AuthPage = () => {
  const { signIn, signUp, loading, user } = useSupabaseAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  if (user) {
    navigate(role === "teacher" ? "/teacher-dashboard" : "/student-attendance");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isRegister) {
      const { error } = await signUp(email, password, name, role);
      if (error) {
        setError(error.message);
      } else {
        setIsRegister(false);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Card className="p-6 max-w-md w-full space-y-4">
        <h1 className="text-center text-xl font-bold mb-2">{isRegister ? "Register" : "Login"}</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <Input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                required
              />
              <select
                className="w-full py-2 px-3 border rounded"
                value={role}
                onChange={e => setRole(e.target.value)}
                required
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </>
          )}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Loading..." : isRegister ? "Register" : "Login"}
          </Button>
        </form>
        <button
          className="text-xs text-blue-500 underline w-full text-center pt-2"
          type="button"
          onClick={() => {
            setIsRegister(r => !r);
            setError(null);
          }}
        >
          {isRegister ? "Already have an account? Log in" : "Don't have an account? Register"}
        </button>
      </Card>
    </div>
  );
};

export default AuthPage;
