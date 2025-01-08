const FeatureDisabled = (props: { feature: string }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold">Page Not Found</h1>
      <p className="mt-4">The {props.feature} feature is currently disabled.</p>
    </div>
  );
};

export default FeatureDisabled;
