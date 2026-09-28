import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import {
  Check,
  Building,
  GraduationCap,
  Sparkles,
  Zap,
  ShieldCheck,
  HelpCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Percent,
  Users,
  Wallet,
  Gift,
  Star,
  Clock,
  BadgeCheck,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { useAppSelector } from '../../store';
import {
  pricingApi,
  InstitutePackage,
  CreatorPlan,
  InstituteAddOn,
  CreatorAddOn,
  InstitutePricingData,
  CreatorPricingData,
} from '../../shared/api/pricingApi';
import { USER_ROLES } from '../../shared/types';
import { normalizeUserRole } from '../../store/slices/authSlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PricingType = 'institute' | 'course-creator';
type BillingCycle = 'monthly' | 'annually';

interface Props {
  navigation?: any;
  route?: {
    params?: {
      defaultType?: PricingType;
    };
  };
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatINR = (amount: number | null | undefined): string => {
  if (amount == null) return 'Custom';
  if (amount === 0) return 'Free';
  return `₹${amount.toLocaleString('en-IN')}`;
};

// ─── Popular plan heuristic ───────────────────────────────────────────────────

const POPULAR_INSTITUTE_ID = 'GROWTH';
const POPULAR_CREATOR_ID = 'PRO';

// ─── Institute Package Card ───────────────────────────────────────────────────

interface InstituteCardProps {
  pkg: InstitutePackage;
  billingCycle: BillingCycle;
  onSelect: (pkg: InstitutePackage) => void;
}

const InstituteCard: React.FC<InstituteCardProps> = ({ pkg, billingCycle, onSelect }) => {
  const isPopular = pkg.id === POPULAR_INSTITUTE_ID;
  const isEnterprise = pkg.isCustomQuote;

  const displayPrice =
    billingCycle === 'annually' && pkg.annualPrice != null
      ? Math.round(pkg.annualPrice / 12) // monthly equivalent
      : pkg.monthlyPrice;

  const priceLabel =
    pkg.isCustomQuote
      ? 'Custom quote'
      : billingCycle === 'annually' && pkg.annualPrice != null
      ? `${formatINR(Math.round(pkg.annualPrice / 12))}/mo`
      : pkg.priceLabel;

  return (
    <View style={[styles.planCard, isPopular && styles.planCardPopular, isEnterprise && styles.planCardEnterprise]}>
      {/* Popular badge */}
      {isPopular && (
        <View style={styles.popularBadge}>
          <Sparkles size={11} color="#FFF" style={{ marginRight: 3 }} />
          <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
        </View>
      )}
      {isEnterprise && (
        <View style={[styles.popularBadge, styles.enterpriseBadge]}>
          <Star size={11} color="#FFF" style={{ marginRight: 3 }} />
          <Text style={styles.popularBadgeText}>ENTERPRISE</Text>
        </View>
      )}

      {/* Header */}
      <Text style={styles.planName}>{pkg.name}</Text>
      <Text style={styles.planCapLabel}>{pkg.sizeLabel}</Text>

      {/* Price */}
      <View style={styles.priceRow}>
        {pkg.isCustomQuote ? (
          <Text style={styles.customQuoteText}>Let's talk</Text>
        ) : (
          <>
            <Text style={styles.priceAmount}>{formatINR(displayPrice)}</Text>
            <View style={styles.periodCol}>
              <Text style={styles.pricePeriod}>/mo</Text>
              {billingCycle === 'annually' && pkg.annualPrice != null && (
                <Text style={styles.billedAnnuallyText}>billed yearly</Text>
              )}
            </View>
          </>
        )}
      </View>

      {/* Annual savings pill */}
      {billingCycle === 'annually' && pkg.annualPriceLabel && !pkg.isCustomQuote && (
        <View style={styles.savingsPill}>
          <Gift size={12} color="#059669" style={{ marginRight: 4 }} />
          <Text style={styles.savingsPillText}>2 months free · {pkg.annualPriceLabel}/yr</Text>
        </View>
      )}

      <View style={styles.divider} />

      {/* Features */}
      <Text style={styles.featuresTitle}>What's included</Text>
      {pkg.includes.map((feat, idx) => (
        <View key={idx} style={styles.featureItem}>
          <View style={[styles.checkCircle, isPopular && styles.checkCirclePopular]}>
            <Check size={11} color={isPopular ? '#FFFFFF' : '#3E7B74'} strokeWidth={3} />
          </View>
          <Text style={styles.featureText}>{feat}</Text>
        </View>
      ))}

      {/* CTA */}
      <TouchableOpacity
        style={[
          styles.ctaBtn,
          isPopular ? styles.ctaBtnPrimary : isEnterprise ? styles.ctaBtnEnterprise : styles.ctaBtnSecondary,
        ]}
        onPress={() => onSelect(pkg)}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={`Select ${pkg.name} plan`}
      >
        <Text
          style={[
            styles.ctaBtnText,
            isPopular ? styles.ctaBtnTextPrimary : isEnterprise ? styles.ctaBtnTextEnterprise : styles.ctaBtnTextSecondary,
          ]}
        >
          {isEnterprise ? 'Contact Sales' : pkg.isCustomQuote ? 'Get a Quote' : 'Choose Plan'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Creator Plan Card ────────────────────────────────────────────────────────

interface CreatorCardProps {
  plan: CreatorPlan;
  onSelect: (plan: CreatorPlan) => void;
}

const CreatorCard: React.FC<CreatorCardProps> = ({ plan, onSelect }) => {
  const isPopular = plan.id === POPULAR_CREATOR_ID;
  const isFree = plan.monthlyFee === 0;

  return (
    <View style={[styles.planCard, isPopular && styles.planCardPopular]}>
      {isPopular && (
        <View style={styles.popularBadge}>
          <Sparkles size={11} color="#FFF" style={{ marginRight: 3 }} />
          <Text style={styles.popularBadgeText}>BEST VALUE</Text>
        </View>
      )}

      {/* Header */}
      <Text style={styles.planName}>{plan.name}</Text>

      {/* Price */}
      <View style={styles.priceRow}>
        <Text style={styles.priceAmount}>{isFree ? 'Free' : formatINR(plan.monthlyFee)}</Text>
        {!isFree && (
          <View style={styles.periodCol}>
            <Text style={styles.pricePeriod}>/mo</Text>
          </View>
        )}
      </View>

      {/* Commission pill */}
      <View style={[styles.commissionPill, isPopular && styles.commissionPillPopular]}>
        <Percent size={12} color={isPopular ? '#3E7B74' : '#64748B'} style={{ marginRight: 5 }} />
        <Text style={[styles.commissionText, isPopular && styles.commissionTextPopular]}>
          {plan.commissionLabel} platform commission
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Features */}
      <Text style={styles.featuresTitle}>What's included</Text>
      {plan.includes.map((feat, idx) => (
        <View key={idx} style={styles.featureItem}>
          <View style={[styles.checkCircle, isPopular && styles.checkCirclePopular]}>
            <Check size={11} color={isPopular ? '#FFFFFF' : '#3E7B74'} strokeWidth={3} />
          </View>
          <Text style={styles.featureText}>{feat}</Text>
        </View>
      ))}

      {/* CTA */}
      <TouchableOpacity
        style={[styles.ctaBtn, isPopular ? styles.ctaBtnPrimary : styles.ctaBtnSecondary]}
        onPress={() => onSelect(plan)}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={`Select ${plan.name} plan`}
      >
        <Text style={[styles.ctaBtnText, isPopular ? styles.ctaBtnTextPrimary : styles.ctaBtnTextSecondary]}>
          {isFree ? 'Get Started Free' : 'Choose Plan'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Add-ons Section ──────────────────────────────────────────────────────────

interface AddOnsProps {
  addOns: (InstituteAddOn | CreatorAddOn)[];
}

const AddOnsSection: React.FC<AddOnsProps> = ({ addOns }) => {
  if (!addOns || addOns.length === 0) return null;
  return (
    <View style={styles.addOnsSection}>
      <Text style={styles.addOnsHeading}>Optional Add-ons</Text>
      {addOns.map((addon) => (
        <View key={addon.id} style={styles.addonRow}>
          <Zap size={14} color="#F59E0B" style={{ marginRight: 8 }} />
          <Text style={styles.addonName}>{addon.name}</Text>
          <Text style={styles.addonPrice}>{addon.priceLabel}</Text>
        </View>
      ))}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const PricingPlansScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user, role } = useAppSelector((state) => state.auth);
  const normalizedRole = normalizeUserRole(role || user?.role || '');

  const initialType: PricingType =
    route?.params?.defaultType ||
    (normalizedRole === USER_ROLES.INSTITUTE ||
    normalizedRole === USER_ROLES.ADMIN ||
    normalizedRole === USER_ROLES.SUPER_ADMIN
      ? 'institute'
      : normalizedRole === USER_ROLES.COURSE_CREATOR
      ? 'course-creator'
      : 'institute');

  const [pricingType, setPricingType] = useState<PricingType>(initialType);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Institute state
  const [instituteData, setInstituteData] = useState<InstitutePricingData | null>(null);
  // Creator state
  const [creatorData, setCreatorData] = useState<CreatorPricingData | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchPricing = useCallback(async (type: PricingType) => {
    setLoading(true);
    setIsUsingFallback(false);
    try {
      if (type === 'institute') {
        const res = await pricingApi.getInstitutePricing();
        if (res.success && res.data?.packages?.length > 0) {
          setInstituteData(res.data);
        } else {
          setIsUsingFallback(true);
        }
      } else {
        const res = await pricingApi.getCourseCreatorPricing();
        if (res.success && res.data?.plans?.length > 0) {
          setCreatorData(res.data);
        } else {
          setIsUsingFallback(true);
        }
      }
    } catch {
      setIsUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricing(pricingType);
  }, [pricingType, fetchPricing]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPricing(pricingType);
    setRefreshing(false);
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSelectInstitutePlan = (pkg: InstitutePackage) => {
    if (pkg.isCustomQuote) {
      handleContactSales();
      return;
    }
    const price =
      billingCycle === 'annually' && pkg.annualPriceLabel
        ? pkg.annualPriceLabel
        : pkg.priceLabel;
    Alert.alert(
      `${pkg.name} Plan`,
      `You're subscribing to the ${pkg.name} plan (${pkg.sizeLabel}) at ${price}.\n\nProceed to payment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed to Payment',
          onPress: () =>
            Alert.alert('Payment', 'Our secure payment gateway will open shortly.', [{ text: 'OK' }]),
        },
      ]
    );
  };

  const handleSelectCreatorPlan = (plan: CreatorPlan) => {
    if (plan.monthlyFee === 0) {
      Alert.alert('Free Plan', 'You are now on the Free plan. Start listing your courses!', [{ text: 'OK' }]);
      return;
    }
    Alert.alert(
      `${plan.name} Plan`,
      `Subscribe to ${plan.name} at ${plan.feeLabel} with ${plan.commissionLabel} commission per sale.\n\nProceed to payment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed to Payment',
          onPress: () =>
            Alert.alert('Payment', 'Our secure payment gateway will open shortly.', [{ text: 'OK' }]),
        },
      ]
    );
  };

  const handleContactSales = () => {
    Linking.openURL('mailto:sales@edorapad.com?subject=Enterprise%20Plan%20Inquiry');
  };

  // ── FAQ data ───────────────────────────────────────────────────────────────

  const instituteFaqs = [
    {
      q: 'What happens when I exceed my student cap?',
      a: instituteData?.terms?.overageRule ||
        'Exceeding a package student cap moves the institute to the next tier — no per-student metering, no surprise bills.',
    },
    {
      q: 'How does the annual plan work?',
      a: instituteData?.terms?.annualPlan?.description ||
        'Pay for 10 months and get 12 — effectively 2 months free on any package.',
    },
    {
      q: 'Is there a founding customer offer?',
      a: instituteData?.terms?.foundingCustomerOffer?.description ||
        'First 30 institutes get the Starter plan at a locked-in rate for 12 months in exchange for a testimonial.',
    },
    {
      q: 'Can I cancel or upgrade at any time?',
      a: 'Yes. You can upgrade, downgrade, or cancel your subscription at any time from your account settings.',
    },
  ];

  const creatorFaqs = [
    {
      q: 'When do I get paid for my course sales?',
      a: creatorData?.terms?.payoutCycle?.description || 'Payouts are processed every 15 days via direct bank transfer.',
    },
    {
      q: 'Do institutes also pay marketplace commission?',
      a: creatorData?.terms?.institutionalCreators?.description ||
        'Schools on Growth or Institution plans get the 5% Elite commission rate automatically.',
    },
    {
      q: 'What payment methods are supported?',
      a: 'We support UPI, Net Banking, Credit/Debit cards (Razorpay & Stripe for international).',
    },
    {
      q: 'Can I switch plans any time?',
      a: 'Yes. Upgrades apply immediately; downgrades take effect at the start of your next billing period.',
    },
  ];

  const activeFaqs = pricingType === 'institute' ? instituteFaqs : creatorFaqs;

  // ── Render ──────────────────────────────────────────────────────────────────

  const renderInstituteContent = () => {
    if (!instituteData) return null;
    return (
      <>
        {/* Headline */}
        <View style={styles.headlinePill}>
          <BadgeCheck size={13} color="#3E7B74" style={{ marginRight: 5 }} />
          <Text style={styles.headlineText} numberOfLines={2}>{instituteData.headline}</Text>
        </View>

        {/* Billing toggle */}
        <View style={styles.billingToggleRow}>
          <TouchableOpacity
            style={[styles.cyclePill, billingCycle === 'monthly' && styles.cyclePillActive]}
            onPress={() => setBillingCycle('monthly')}
            activeOpacity={0.8}
          >
            <Text style={[styles.cycleText, billingCycle === 'monthly' && styles.cycleTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cyclePill, billingCycle === 'annually' && styles.cyclePillActive]}
            onPress={() => setBillingCycle('annually')}
            activeOpacity={0.8}
          >
            <Text style={[styles.cycleText, billingCycle === 'annually' && styles.cycleTextActive]}>
              Annual
            </Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>2 MONTHS FREE</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Plans */}
        <View style={styles.plansList}>
          {instituteData.packages.map((pkg) => (
            <InstituteCard
              key={pkg.id}
              pkg={pkg}
              billingCycle={billingCycle}
              onSelect={handleSelectInstitutePlan}
            />
          ))}
        </View>

        {/* Add-ons */}
        <AddOnsSection addOns={instituteData.addOns} />

        {/* Overage note */}
        {instituteData.terms?.overageRule && (
          <View style={styles.overageNote}>
            <ShieldCheck size={14} color="#3E7B74" style={{ marginRight: 6 }} />
            <Text style={styles.overageNoteText}>{instituteData.terms.overageRule}</Text>
          </View>
        )}
      </>
    );
  };

  const renderCreatorContent = () => {
    if (!creatorData) return null;
    return (
      <>
        {/* Headline */}
        <View style={styles.headlinePill}>
          <BadgeCheck size={13} color="#3E7B74" style={{ marginRight: 5 }} />
          <Text style={styles.headlineText} numberOfLines={2}>{creatorData.headline}</Text>
        </View>

        {/* Plans */}
        <View style={styles.plansList}>
          {creatorData.plans.map((plan) => (
            <CreatorCard key={plan.id} plan={plan} onSelect={handleSelectCreatorPlan} />
          ))}
        </View>

        {/* Add-ons */}
        <AddOnsSection addOns={creatorData.addOns} />

        {/* Payout info */}
        {creatorData.terms?.payoutCycle && (
          <View style={styles.payoutNote}>
            <Clock size={14} color="#7C3AED" style={{ marginRight: 6 }} />
            <Text style={styles.payoutNoteText}>
              Payouts every {creatorData.terms.payoutCycle.days} days via {creatorData.terms.payoutCycle.method}.
            </Text>
          </View>
        )}
      </>
    );
  };

  return (
    <ScreenContainer>
      <Header
        title="Pricing & Plans"
        subtitle="Transparent pricing for modern education."
        showBack={navigation?.canGoBack ? navigation.canGoBack() : true}
        onBack={() => navigation?.goBack?.()}
        rightAction={
          <TouchableOpacity onPress={onRefresh} style={styles.headerIconBtn} activeOpacity={0.7}>
            <RefreshCw size={18} color="#1E293B" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Segment switcher */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, pricingType === 'institute' && styles.segmentBtnActive]}
            onPress={() => setPricingType('institute')}
            activeOpacity={0.8}
          >
            <Building size={15} color={pricingType === 'institute' ? '#FFF' : '#64748B'} style={{ marginRight: 6 }} />
            <Text style={[styles.segmentText, pricingType === 'institute' && styles.segmentTextActive]}>
              Institutions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, pricingType === 'course-creator' && styles.segmentBtnActive]}
            onPress={() => setPricingType('course-creator')}
            activeOpacity={0.8}
          >
            <GraduationCap size={15} color={pricingType === 'course-creator' ? '#FFF' : '#64748B'} style={{ marginRight: 6 }} />
            <Text style={[styles.segmentText, pricingType === 'course-creator' && styles.segmentTextActive]}>
              Course Creators
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fallback notice */}
        {isUsingFallback && !loading && (
          <View style={styles.fallbackNotice}>
            <ShieldCheck size={14} color="#3E7B74" style={{ marginRight: 6 }} />
            <Text style={styles.fallbackNoticeText}>
              Pricing data unavailable. Pull down to retry.
            </Text>
          </View>
        )}

        {/* Loading */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.colors.primary} />
            <Text style={styles.loadingText}>Fetching latest pricing...</Text>
          </View>
        ) : (
          <>
            {pricingType === 'institute' ? renderInstituteContent() : renderCreatorContent()}

            {/* Enterprise / Custom CTA Banner */}
            <View style={styles.ctaBanner}>
              <View style={styles.ctaBannerIconBox}>
                <Zap size={22} color="#FFF" />
              </View>
              <View style={styles.ctaBannerContent}>
                <Text style={styles.ctaBannerTitle}>Need a custom deployment?</Text>
                <Text style={styles.ctaBannerSubtitle}>
                  Dedicated infra, SSO, white-label & volume pricing for 2,000+ student networks.
                </Text>
                <TouchableOpacity
                  style={styles.ctaBannerBtn}
                  onPress={handleContactSales}
                  activeOpacity={0.8}
                >
                  <MessageCircle size={14} color="#3E7B74" style={{ marginRight: 6 }} />
                  <Text style={styles.ctaBannerBtnText}>Talk to an Education Advisor</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* FAQ */}
            <View style={styles.faqSection}>
              <View style={styles.faqHeaderRow}>
                <HelpCircle size={19} color="#3E7B74" style={{ marginRight: 8 }} />
                <Text style={styles.faqHeading}>Frequently Asked Questions</Text>
              </View>

              {activeFaqs.map((faq, i) => {
                const isOpen = expandedFaq === i;
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.faqCard}
                    onPress={() => setExpandedFaq(isOpen ? null : i)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.faqQuestionRow}>
                      <Text style={styles.faqQuestionText}>{faq.q}</Text>
                      {isOpen ? (
                        <ChevronUp size={17} color="#64748B" />
                      ) : (
                        <ChevronDown size={17} color="#64748B" />
                      )}
                    </View>
                    {isOpen && <Text style={styles.faqAnswerText}>{faq.a}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerIconBtn: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },

  // ─── Segment ─────────────────────────────────────────────────────────────
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 13,
    padding: 4,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#3E7B74',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ─── Headline pill ────────────────────────────────────────────────────────
  headlinePill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  headlineText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '500',
    flex: 1,
    lineHeight: 17,
  },

  // ─── Billing toggle ───────────────────────────────────────────────────────
  billingToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cyclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  cyclePillActive: {
    borderColor: '#3E7B74',
    backgroundColor: '#E8F4F1',
  },
  cycleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  cycleTextActive: {
    color: '#3E7B74',
    fontWeight: '700',
  },
  saveBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 7,
  },
  saveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // ─── Fallback ─────────────────────────────────────────────────────────────
  fallbackNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  fallbackNoticeText: {
    fontSize: 12,
    color: '#9A3412',
    fontWeight: '500',
    flex: 1,
  },

  // ─── Loading ──────────────────────────────────────────────────────────────
  loadingContainer: {
    paddingVertical: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  // ─── Plan cards ───────────────────────────────────────────────────────────
  plansList: {
    gap: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    marginTop: 8,
  },
  planCardPopular: {
    borderColor: '#3E7B74',
    borderWidth: 2,
    shadowColor: '#3E7B74',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  planCardEnterprise: {
    borderColor: '#7C3AED',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -13,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3E7B74',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#3E7B74',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  enterpriseBadge: {
    backgroundColor: '#7C3AED',
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  planCapLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 12,
  },

  // ─── Price row ────────────────────────────────────────────────────────────
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  priceAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  customQuoteText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#7C3AED',
  },
  periodCol: {
    marginLeft: 5,
  },
  pricePeriod: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  billedAnnuallyText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  savingsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  savingsPillText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '700',
  },

  // ─── Commission pill ──────────────────────────────────────────────────────
  commissionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  commissionPillPopular: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  commissionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  commissionTextPopular: {
    color: '#065F46',
  },

  // ─── Divider ──────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },

  // ─── Features ─────────────────────────────────────────────────────────────
  featuresTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 9,
  },
  checkCircle: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: '#E8F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    marginTop: 1,
  },
  checkCirclePopular: {
    backgroundColor: '#3E7B74',
  },
  featureText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    flex: 1,
  },

  // ─── CTA button ───────────────────────────────────────────────────────────
  ctaBtn: {
    marginTop: 18,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnPrimary: {
    backgroundColor: '#3E7B74',
    shadowColor: '#3E7B74',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 4,
  },
  ctaBtnSecondary: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  ctaBtnEnterprise: {
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  ctaBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  ctaBtnTextPrimary: {
    color: '#FFFFFF',
  },
  ctaBtnTextSecondary: {
    color: '#1E293B',
  },
  ctaBtnTextEnterprise: {
    color: '#FFFFFF',
  },

  // ─── Add-ons ──────────────────────────────────────────────────────────────
  addOnsSection: {
    marginTop: 24,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
  },
  addOnsHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addonName: {
    fontSize: 13,
    color: '#78350F',
    fontWeight: '500',
    flex: 1,
  },
  addonPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },

  // ─── Overage / payout notes ───────────────────────────────────────────────
  overageNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 10,
    padding: 10,
  },
  overageNoteText: {
    fontSize: 12,
    color: '#0F766E',
    lineHeight: 17,
    flex: 1,
    fontWeight: '500',
  },
  payoutNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 10,
    padding: 10,
  },
  payoutNoteText: {
    fontSize: 12,
    color: '#5B21B6',
    fontWeight: '500',
    flex: 1,
  },

  // ─── Enterprise / Contact banner ──────────────────────────────────────────
  ctaBanner: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 18,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ctaBannerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#3E7B74',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
    flexShrink: 0,
  },
  ctaBannerContent: {
    flex: 1,
  },
  ctaBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ctaBannerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
    marginBottom: 12,
  },
  ctaBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  ctaBannerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3E7B74',
  },

  // ─── FAQ ──────────────────────────────────────────────────────────────────
  faqSection: {
    marginTop: 28,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  faqHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    paddingRight: 8,
    lineHeight: 19,
  },
  faqAnswerText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
});

export default PricingPlansScreen;
