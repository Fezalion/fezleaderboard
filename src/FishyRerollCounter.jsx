const FISHY_ACCOUNT_NAME = "RadiatedFishy#5731";

const FishyRerollCounter = ({ ladder, THEME }) => {
  const charCount = (ladder || []).filter(
    (e) => e.account?.name === FISHY_ACCOUNT_NAME,
  ).length;
  const rerolls = Math.max(charCount - 1, 0);

  return (
    <table
      className={`w-full border-collapse ${THEME.textPrimary} border-2 ${THEME.borderPrimary} ${THEME.glowLarge} rounded-lg overflow-hidden glass-panel`}
    >
      <thead>
        <tr
          className={`${THEME.accentPrimary} ${THEME.textPrimary} border-b-2 ${THEME.borderPrimary}`}
        >
          <th className="p-2 text-left" colSpan={2}>
            🎣 Fishy Reroll Counter
          </th>
        </tr>
      </thead>
      <tbody>
        <tr className={`${THEME.rowEven} ${THEME.rowBorder}`}>
          <td
            className={`p-2 ${THEME.textPrimary} font-mono font-bold text-center text-8xl`}
          >
            {rerolls}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default FishyRerollCounter;
