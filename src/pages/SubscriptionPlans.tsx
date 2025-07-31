import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Star,
  Zap,
  Shield,
  Users,
  BarChart3,
  Calendar,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  duration: string;
  price: number;
  originalPrice?: number;
  savings?: string;
  popular?: boolean;
  features: string[];
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const plans: Plan[] = [
  {
    id: "monthly",
    name: "Basic Plan",
    duration: "1 Month",
    price: 999,
    description: "Perfect for small dairy farms getting started",
    icon: Calendar,
    color: "from-blue-500 to-blue-600",
    features: [
      "Up to 50 farmers management",
      "Basic milk collection tracking",
      "Daily reports",
      "Email support",
      "Mobile app access",
      "Basic analytics",
      "Export data (PDF)",
      "1 user account",
    ],
  },
  {
    id: "quarterly",
    name: "Professional Plan",
    duration: "3 Months",
    price: 2499,
    originalPrice: 2997,
    savings: "₹498",
    popular: true,
    description: "Ideal for growing dairy businesses",
    icon: Users,
    color: "from-purple-500 to-purple-600",
    features: [
      "Up to 200 farmers management",
      "Advanced milk collection tracking",
      "Real-time analytics",
      "Priority email support",
      "Mobile app access",
      "Advanced reporting",
      "Export data (PDF & Excel)",
      "Up to 3 user accounts",
      "SMS notifications",
      "Inventory management",
      "Payment tracking",
      "Custom reports",
    ],
  },
  {
    id: "biannual",
    name: "Business Plan",
    duration: "6 Months",
    price: 4499,
    originalPrice: 5994,
    savings: "₹1495",
    description: "For established dairy operations",
    icon: BarChart3,
    color: "from-green-500 to-green-600",
    features: [
      "Unlimited farmers management",
      "Complete milk collection system",
      "Advanced analytics & insights",
      "Phone & email support",
      "Mobile app access",
      "Custom dashboard",
      "Export data (PDF, Excel, CSV)",
      "Up to 5 user accounts",
      "SMS & WhatsApp notifications",
      "Full inventory management",
      "Payment & billing system",
      "Custom reports & analytics",
      "API access",
      "Data backup & recovery",
    ],
  },
  {
    id: "annual",
    name: "Enterprise Plan",
    duration: "1 Year",
    price: 7999,
    originalPrice: 11988,
    savings: "₹3989",
    description: "Complete solution for large dairy enterprises",
    icon: Shield,
    color: "from-orange-500 to-orange-600",
    features: [
      "Unlimited everything",
      "Complete dairy management suite",
      "AI-powered analytics",
      "24/7 priority support",
      "Mobile app access",
      "Custom branding",
      "All export formats",
      "Unlimited user accounts",
      "Multi-channel notifications",
      "Advanced inventory & supply chain",
      "Complete financial management",
      "Advanced reporting & BI",
      "Full API access",
      "Data backup & recovery",
      "Custom integrations",
      "Dedicated account manager",
      "Training & onboarding",
      "White-label solution",
    ],
  },
];

export default function SubscriptionPlans() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPlan = async (planId: string) => {
    setIsLoading(true);
    setSelectedPlan(planId);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Navigate to payment page or handle subscription
    navigate(`/payment?plan=${planId}`);
  };

  const handleContactSales = () => {
    // Navigate to contact page or open contact form
    navigate("/contact");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t("subscription.title")}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t("subscription.subtitle")}
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "relative transition-all duration-300 hover:shadow-xl hover:-translate-y-2",
                plan.popular && "ring-2 ring-purple-500 shadow-lg"
              )}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white">
                  {t("subscription.mostPopular")}
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4",
                    `bg-gradient-to-r ${plan.color}`
                  )}
                >
                  <plan.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Pricing */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-3xl font-bold">₹{plan.price}</span>
                    <span className="text-gray-500">/ {plan.duration}</span>
                  </div>

                  {plan.originalPrice && (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <span className="text-gray-500 line-through">
                        ₹{plan.originalPrice}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {t("subscription.save")} {plan.savings}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <Button
                  className={cn(
                    "w-full",
                    plan.popular
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  )}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isLoading && selectedPlan === plan.id}
                >
                  {isLoading && selectedPlan === plan.id ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("subscription.processing")}
                    </div>
                  ) : (
                    `${t("subscription.choosePlan")} ${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">
            {t("subscription.planComparison")}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">
                    {t("subscription.features")}
                  </th>
                  <th className="text-center py-3 px-4 font-semibold">
                    {t("subscription.basicPlan")}
                  </th>
                  <th className="text-center py-3 px-4 font-semibold">
                    {t("subscription.professionalPlan")}
                  </th>
                  <th className="text-center py-3 px-4 font-semibold">
                    {t("subscription.businessPlan")}
                  </th>
                  <th className="text-center py-3 px-4 font-semibold">
                    {t("subscription.enterprisePlan")}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">
                    {t("subscription.farmersLimit")}
                  </td>
                  <td className="text-center py-3 px-4">50</td>
                  <td className="text-center py-3 px-4">200</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">
                    {t("subscription.userAccounts")}
                  </td>
                  <td className="text-center py-3 px-4">1</td>
                  <td className="text-center py-3 px-4">3</td>
                  <td className="text-center py-3 px-4">5</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">
                    {t("subscription.support")}
                  </td>
                  <td className="text-center py-3 px-4">Email</td>
                  <td className="text-center py-3 px-4">Priority Email</td>
                  <td className="text-center py-3 px-4">Phone & Email</td>
                  <td className="text-center py-3 px-4">24/7 Priority</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">
                    {t("subscription.analytics")}
                  </td>
                  <td className="text-center py-3 px-4">
                    {t("subscription.basic")}
                  </td>
                  <td className="text-center py-3 px-4">
                    {t("subscription.advanced")}
                  </td>
                  <td className="text-center py-3 px-4">
                    {t("subscription.custom")}
                  </td>
                  <td className="text-center py-3 px-4">AI-Powered</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">
                    {t("subscription.apiAccess")}
                  </td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 font-medium">
                    {t("subscription.customBranding")}
                  </td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">
                    {t("subscription.dedicatedManager")}
                  </td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">
            {t("subscription.faq")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">
                {t("subscription.upgradeQuestion")}
              </h3>
              <p className="text-gray-600 text-sm">
                {t("subscription.upgradeAnswer")}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                {t("subscription.trialQuestion")}
              </h3>
              <p className="text-gray-600 text-sm">
                {t("subscription.trialAnswer")}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                {t("subscription.paymentQuestion")}
              </h3>
              <p className="text-gray-600 text-sm">
                {t("subscription.paymentAnswer")}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">
                {t("subscription.cancelQuestion")}
              </h3>
              <p className="text-gray-600 text-sm">
                {t("subscription.cancelAnswer")}
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">
              {t("subscription.customSolution")}
            </h2>
            <p className="text-xl mb-6 opacity-90">
              {t("subscription.customSolutionSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="secondary"
                size="lg"
                onClick={handleContactSales}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                {t("subscription.contactSales")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/demo")}
                className="border-white text-white hover:bg-white hover:text-blue-600"
              >
                {t("subscription.requestDemo")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
