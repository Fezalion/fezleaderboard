const FISHY_ACCOUNT_NAME = "RadiatedFishy#5731";

const FishyRerollCounter = ({ ladder }) => {
  const charCount = (ladder || []).filter(
    (e) => e.account?.name === FISHY_ACCOUNT_NAME,
  ).length;
  const rerolls = Math.max(charCount - 1, 0);

  return (
    <section className="panel">
      <h2>fishy reroll counter</h2>
      <p className="big">{rerolls}</p>
    </section>
  );
};

export default FishyRerollCounter;