import bandage from "./card-bandage.jpg";
import blood from "./card-blood.jpg";
import clinic from "./card-clinic.jpg";
import diagnose from "./card-diagnose.jpg";
import eventAdvocacy from "./card-event-advocacy.jpg";
import eventCamp from "./card-event-camp.jpg";
import eventWhd from "./card-event-whd.jpg";
import fundraising from "./card-fundraising.jpg";
import genetics from "./card-genetics.jpg";
import halfLife from "./card-half-life.jpg";
import hands from "./card-hands.jpg";
import inhibitor from "./card-inhibitor.jpg";
import newsKathmandu from "./card-news-members.jpg";
import newsProvinces from "./card-news-provinces.jpg";
import newsWhd from "./card-news-whd.jpg";
import nonFactor from "./card-nonfactor.jpg";
import pregnancy from "./card-pregnancy.jpg";
import prophylaxis from "./card-prophylaxis.jpg";
import question from "./card-question.jpg";
import vial from "./card-vial.jpg";

export const cardImages = {
  blood,
  question,
  bandage,
  vial,
  hands,
  clinic,
  genetics,
  diagnose,
  pregnancy,
  prophylaxis,
  nonFactor,
  halfLife,
  inhibitor,
  fundraising,
  newsProvinces,
  newsKathmandu,
  newsWhd,
  eventWhd,
  eventAdvocacy,
  eventCamp,
} as const;

export type CardImage = keyof typeof cardImages;
