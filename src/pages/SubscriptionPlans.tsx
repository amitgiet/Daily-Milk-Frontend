import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Star,
  Users,
  Zap,
  Shield,
  Headphones,
  BarChart3,
  Code,
  Palette,
  UserCheck,
  Mail,
  Phone,
  Clock,
  CreditCard,
  ArrowRight,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { apiCall } from '@/lib/apiCall';
import { allRoutes } from '@/lib/apiRoutes';
import { toast } from 'react-toastify';
import { SubscriptionPlan } from '@/types/subscription';

export default function SubscriptionPlans() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const response = await apiCall(allRoutes.subscriptions.list, 'get');
      if (response.success && response.data) {
        const plansData = Array.isArray(response.data) ? response.data : [];
        // Only show active plans to users
        const activePlans = plansData.filter(plan => plan.isActive);
        setPlans(activePlans);
      } else {
        setPlans([]);
      }
    } catch (error) {
      console.error('Error loading subscription plans:', error);
      toast.error('Failed to load subscription plans');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    setIsProcessing(true);
    try {
      const response = await apiCall(
        allRoutes.subscriptions.request,
        'post',
        { planId: plan.id }
      );
      
      if (response.success) {
        toast.success('Subscription request submitted successfully!');
        setSelectedPlan(plan);
      } else {
        toast.error('Failed to submit subscription request');
      }
    } catch (error) {
      console.error('Error submitting subscription request:', error);
      toast.error('Failed to submit subscription request');
    } finally {
      setIsProcessing(false);
    }
  };

  const getFeatureIcon = (feature: string) => {
    const featureLower = feature.toLowerCase();
    if (featureLower.includes('farmers') || featureLower.includes('users')) return <Users className="h-4 w-4" />;
    if (featureLower.includes('analytics') || featureLower.includes('reports')) return <BarChart3 className="h-4 w-4" />;
    if (featureLower.includes('api')) return <Code className="h-4 w-4" />;
    if (featureLower.includes('branding') || featureLower.includes('custom')) return <Palette className="h-4 w-4" />;
    if (featureLower.includes('support') || featureLower.includes('help')) return <Headphones className="h-4 w-4" />;
    if (featureLower.includes('manager') || featureLower.includes('dedicated')) return <UserCheck className="h-4 w-4" />;
    if (featureLower.includes('email')) return <Mail className="h-4 w-4" />;
    if (featureLower.includes('phone')) return <Phone className="h-4 w-4" />;
    if (featureLower.includes('priority') || featureLower.includes('24/7')) return <Clock className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {t('subscription.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('subscription.subtitle')}
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
          {plans.map((plan, index) => (
            <Card 
              key={plan.id} 
              className={`relative transition-all duration-300 hover:shadow-lg flex flex-col ${
                selectedPlan?.id === plan.id ? 'ring-2 ring-primary' : ''
              }`}
            >
              {/* Popular Badge */}
              {index === 1 && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    {t('subscription.mostPopular')}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-bold text-primary">
                    ₹{typeof plan.price === 'string' ? plan.price : plan.price.toString()}
                  </span>
                  <span className="text-muted-foreground">/ {plan.durationDays} days</span>
                </div>
                <CardDescription className="text-sm">
                  {plan.durationDays === 30 && t('subscription.monthly')}
                  {plan.durationDays === 90 && t('subscription.quarterly')}
                  {plan.durationDays === 180 && t('subscription.biannual')}
                  {plan.durationDays === 365 && t('subscription.annual')}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 flex-1 flex flex-col">
                {/* Features */}
                {plan.features && plan.features.length > 0 && (
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <div className="text-primary">
                          {getFeatureIcon(feature)}
                        </div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Default Features */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Core dairy management features</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Mobile responsive design</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Data backup & security</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Email support</span>
                  </div>
                </div>

                {/* Action Button - Bottom Aligned */}
                <div className="mt-auto pt-6">
                  <Button 
                    className="w-full"
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {t('subscription.processing')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {t('subscription.choosePlan')}
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            {t('subscription.faq')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  {t('subscription.upgradeQuestion')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('subscription.upgradeAnswer')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  {t('subscription.trialQuestion')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('subscription.trialAnswer')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  {t('subscription.paymentQuestion')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('subscription.paymentAnswer')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  {t('subscription.cancelQuestion')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('subscription.cancelAnswer')}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Custom Solution CTA */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">{t('subscription.customSolution')}</CardTitle>
              <CardDescription>{t('subscription.customSolutionSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {t('subscription.contactSales')}
              </Button>
              <Button className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                {t('subscription.requestDemo')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
