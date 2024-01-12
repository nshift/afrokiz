import moment from "moment";

const makePromotion = (promotion: {
  name: string;
  start: Date;
  end: Date;
}) => ({
  text:
    promotion.name +
    " promotion ends in " +
    moment(promotion.end).diff(moment(new Date()), "days") +
    " days.",
  isActive:
    moment(moment(new Date())).diff(promotion.start, "days") > 0 &&
    moment(promotion.end).diff(moment(new Date()), "days") > 0,
});

const promotions = [
  makePromotion({
    name: "Early bird",
    start: new Date("2024-01-01"),
    end: new Date("2024-01-31"),
  }),
  makePromotion({
    name: "30% off",
    start: new Date("2024-02-01"),
    end: new Date("2024-02-28"),
  }),
  makePromotion({
    name: "25% off",
    start: new Date("2024-03-01"),
    end: new Date("2024-04-30"),
  }),
  makePromotion({
    name: "18% off",
    start: new Date("2024-05-01"),
    end: new Date("2024-06-30"),
  }),
  makePromotion({
    name: "5% off",
    start: new Date("2024-07-01"),
    end: new Date("2024-08-31"),
  }),
];

export const promotionText = (() => {
  const activePromotion = promotions.filter(
    (promotion) => promotion.isActive
  )[0];
  if (!activePromotion) {
    const festivalStartInDays = moment(new Date("2024-09-06")).diff(
      moment(new Date()),
      "days"
    );
    console.log({ festivalStartInDays });
    const isAfterFestival = festivalStartInDays < 0;
    return isAfterFestival
      ? "Thank you for making the festival amazing!"
      : `AfroKiz festival is starting in ${festivalStartInDays} days.`;
  }
  return activePromotion.text;
})();
