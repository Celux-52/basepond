export class CostManagerService {
  private static totalGoogleCost = 0;
  private static totalApolloCost = 0;
  private static totalOpenRouterCost = 0;

  // Prices in USD (example defaults)
  private static readonly PRICING = {
    GOOGLE_PLACES_API: 0.017,
    APOLLO_API: 0.010,
    OPENROUTER_API: 0.005
  };

  static trackGoogleCall() {
    this.totalGoogleCost += this.PRICING.GOOGLE_PLACES_API;
  }

  static trackApolloCall() {
    this.totalApolloCost += this.PRICING.APOLLO_API;
  }

  static trackOpenRouterCall() {
    this.totalOpenRouterCost += this.PRICING.OPENROUTER_API;
  }

  static getReport() {
    const total = this.totalGoogleCost + this.totalApolloCost + this.totalOpenRouterCost;
    return {
      google: this.totalGoogleCost.toFixed(4),
      apollo: this.totalApolloCost.toFixed(4),
      openRouter: this.totalOpenRouterCost.toFixed(4),
      totalCostUSD: total.toFixed(4)
    };
  }

  static printReport() {
    const report = this.getReport();
    console.log('\n==================================');
    console.log('💰 COST MANAGER REPORT 💰');
    console.log('Google Maps API:   $' + report.google);
    console.log('Apollo API:        $' + report.apollo);
    console.log('OpenRouter API:    $' + report.openRouter);
    console.log('----------------------------------');
    console.log('Total Session Cost:$' + report.totalCostUSD);
    console.log('==================================\n');
  }
}
