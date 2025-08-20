import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Milk, User, Phone, Hash } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "../pages/pnglogo.png"

const signupSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  referralCode: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const success = await registerUser(data);
      
      if (success) {
        setSuccess("Account created successfully! Please check your email for verification.");
        
        // Reset form
        reset();
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError("Failed to create account. Please try again.");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create account. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <img src={Logo} alt="Logo" className="h-20 w-20 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {t('signup.createAccount')}
            </CardTitle>
            <CardDescription>
              {t('signup.createAccountDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
                         <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
               {/* Full Name */}
               <div className="space-y-2">
                 <Label htmlFor="name" className="flex items-center gap-2">
                   <User className="h-4 w-4" />
                   {t('signup.fullName')} *
                 </Label>
                 <Input
                   id="name"
                   placeholder={t('signup.fullNamePlaceholder')}
                   {...register("name")}
                   className={errors.name ? "border-destructive" : ""}
                 />
                 {errors.name && (
                   <p className="text-sm text-destructive">{errors.name.message}</p>
                 )}
               </div>

               {/* Phone Number */}
               <div className="space-y-2">
                 <Label htmlFor="phone" className="flex items-center gap-2">
                   <Phone className="h-4 w-4" />
                   {t('signup.phoneNumber')} *
                 </Label>
                 <Input
                   id="phone"
                   type="tel"
                   placeholder={t('signup.phoneNumberPlaceholder')}
                   {...register("phone")}
                   className={errors.phone ? "border-destructive" : ""}
                 />
                 {errors.phone && (
                   <p className="text-sm text-destructive">{errors.phone.message}</p>
                 )}
               </div>

              {/* Referral Code */}
              <div className="space-y-2">
                <Label htmlFor="referralCode" className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  {t('signup.referralCode')} ({t('signup.optional')})
                </Label>
                <Input
                  id="referralCode"
                  placeholder={t('signup.referralCodePlaceholder')}
                  {...register("referralCode")}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  {t('signup.password')} *
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('signup.passwordPlaceholder')}
                  {...register("password")}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t('signup.confirmPassword')} *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('signup.confirmPasswordPlaceholder')}
                  {...register("confirmPassword")}
                  className={errors.confirmPassword ? "border-destructive" : ""}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Error/Success Messages */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? t('signup.creatingAccount') : t('signup.createAccount')}
              </Button>

              {/* Login Link */}
              <div className="text-center text-sm text-muted-foreground">
                {t('signup.alreadyHaveAccount')}{" "}
                <Link
                  to="/login"
                  className="text-primary hover:underline font-medium"
                >
                  {t('signup.signIn')}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 