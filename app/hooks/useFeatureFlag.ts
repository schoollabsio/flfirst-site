function useFeatureFlag(featureName: string): boolean {
  if (typeof window === "undefined") return false;

  const url = new URL(window.location.href);
  return url.searchParams.get("feature." + featureName) === "true";
}

export default useFeatureFlag;
