import { ROLE_FEATURES, SUBSCRIPTION_FEATURES } from '../constants/roles';
import { UserRole, SubscriptionPlan, FeatureKey, USER_ROLES } from '../types';

export const hasFeatureAccess = (
  feature: FeatureKey,
  userRole?: UserRole,
  subscriptionPlan: SubscriptionPlan = 'free'
): boolean => {
  if (!userRole) return false;
  
  if (userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.SUPER_ADMIN) {
    return true;
  }

  const roleFeatures = ROLE_FEATURES[userRole] || [];
  const hasRoleAccess = roleFeatures.includes(feature);

  const subscriptionFeatures = SUBSCRIPTION_FEATURES[subscriptionPlan] || [];
  const hasSubscriptionAccess = subscriptionFeatures.includes(feature);

  return hasRoleAccess && hasSubscriptionAccess;
};

export const getAvailableFeatures = (
  userRole?: UserRole,
  subscriptionPlan: SubscriptionPlan = 'free'
): FeatureKey[] => {
  if (!userRole) return [];
  const roleFeatures = ROLE_FEATURES[userRole] || [];
  const subscriptionFeatures = SUBSCRIPTION_FEATURES[subscriptionPlan] || [];

  return roleFeatures.filter(feature => subscriptionFeatures.includes(feature));
};
