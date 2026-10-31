import { describe, expect, it } from "vitest";
import { getCashInsightKey } from "./cash-insight";

const NOTHING = {
  businessIncome: 0,
  businessExpense: 0,
  profit: 0,
  ownerTaken: 0,
  cashIn: 0,
  cashOut: 0,
  cashLeft: 0,
};

describe("getCashInsightKey", () => {
  it("asks for the first records when nothing was logged", () => {
    expect(getCashInsightKey(NOTHING)).toBe("empty");
  });

  it("asks for sales when only costs were logged", () => {
    expect(
      getCashInsightKey({
        ...NOTHING,
        businessExpense: 400_000,
        profit: -400_000,
        cashOut: 400_000,
        cashLeft: -400_000,
      }),
    ).toBe("noSales");
  });

  it("flags a loss when costs exceed sales", () => {
    expect(
      getCashInsightKey({
        ...NOTHING,
        businessIncome: 300_000,
        businessExpense: 400_000,
        profit: -100_000,
        cashIn: 300_000,
        cashOut: 400_000,
        cashLeft: -100_000,
      }),
    ).toBe("loss");
  });

  it("explains why cash is short when the owner took more than the profit", () => {
    expect(
      getCashInsightKey({
        ...NOTHING,
        businessIncome: 800_000,
        businessExpense: 400_000,
        profit: 400_000,
        ownerTaken: 550_000,
        cashIn: 800_000,
        cashOut: 950_000,
        cashLeft: -150_000,
      }),
    ).toBe("takenMoreThanProfit");
  });

  it("flags negative cash that the profit does not explain, such as loan payments", () => {
    expect(
      getCashInsightKey({
        ...NOTHING,
        businessIncome: 800_000,
        businessExpense: 400_000,
        profit: 400_000,
        ownerTaken: 100_000,
        cashIn: 800_000,
        cashOut: 1_000_000,
        cashLeft: -200_000,
      }),
    ).toBe("cashNegative");
  });

  it("says so when the month looks healthy", () => {
    expect(
      getCashInsightKey({
        ...NOTHING,
        businessIncome: 800_000,
        businessExpense: 400_000,
        profit: 400_000,
        ownerTaken: 100_000,
        cashIn: 800_000,
        cashOut: 500_000,
        cashLeft: 300_000,
      }),
    ).toBe("healthy");
  });
});
