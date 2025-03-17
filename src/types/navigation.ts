export type RootStackParamList = {
  Dashboard: undefined;
  AddMeal: undefined;
  MealHistory: undefined;
  Profile: undefined;
  Settings: undefined;
  Goals: undefined;
  Analysis: undefined;
  Recommendations: undefined;
  AIChat: undefined;
  EditProfile: undefined;
  MainTabs: undefined;
  DashboardTab: undefined;
  AddMealTab: undefined;
  ProfileTab: undefined;
  Notifications: undefined;
  Settings: undefined;
};

export type TabParamList = {
  DashboardTab: undefined;
  AddMealTab: undefined;
  ProfileTab: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 