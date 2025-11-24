import { useState } from "react";

export default function POECharacterDisplay() {
  const [selectedItem, setSelectedItem] = useState(null);

  const ItemSlot = ({ item, slotName, className = "" }) => {
    if (!item) {
      return (
        <div
          className={`bg-slate-800/50 border-2 border-slate-700 border-dashed rounded flex items-center justify-center ${className}`}
        >
          <span className="text-slate-600 text-xs">{slotName}</span>
        </div>
      );
    }

    return (
      <div
        className={`bg-slate-900 border-2 border-amber-700/50 rounded cursor-pointer hover:border-amber-500 transition-all hover:scale-105 ${className}`}
        onMouseEnter={() => setSelectedItem(item)}
        onMouseLeave={() => setSelectedItem(null)}
      >
        <img
          src={item.icon}
          alt={item.name}
          className="w-full h-full object-contain p-1"
        />
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-amber-400 mb-4 text-center">
          Character Equipment
        </h1>

        <div className="bg-slate-800/30 backdrop-blur rounded-lg shadow-2xl p-8 border border-slate-700 w-full h-full">
          <div className="grid grid-cols-10 gap-1">
            {/* Left Column - Weapon 1 */}
            <div className="col-span-2 space-y-4">
              <ItemSlot
                item={null}
                slotName="Weapon"
                className="aspect-[1/2]"
              />
            </div>
            <div className="row-start-2">
              <ItemSlot
                item={null}
                slotName="Trinker"
                className="aspect-square"
              />
            </div>
            <div className="row-start-2">
              <ItemSlot
                item={null}
                slotName="Graft 1"
                className="aspect-[1/3]"
              />
            </div>
            <div className="row-start-2">
              <ItemSlot
                item={null}
                slotName="Graft 2"
                className="aspect-[1/3]"
              />
            </div>
            {/* Middle Column - Armor */}
            <div className="col-span-6 grid grid-cols-3 gap-4">
              {/* Row 1 - Helmet */}
              <div className="col-start-2">
                <ItemSlot
                  item={null}
                  slotName="Helmet"
                  className="aspect-square"
                />
              </div>

              {/* Row 2 - Amulet */}
              <div className="col-start-3 row-start-2">
                <ItemSlot
                  item={null}
                  slotName="Amulet"
                  className="aspect-square"
                />
              </div>

              {/* Row 3 - Body, Rings, Belt */}
              <div className="col-span-1 col-start-1 row-start-2">
                <ItemSlot
                  item={null}
                  slotName="Ring 3"
                  className="aspect-square"
                />
              </div>
              <div className="col-span-1 col-start-1 row-start-3">
                <ItemSlot
                  item={null}
                  slotName="Ring 1"
                  className="aspect-square"
                />
              </div>
              <div className="col-span-1 col-start-2 row-start-2 row-span-2">
                <ItemSlot
                  item={null}
                  slotName="Body"
                  className="aspect-[3/7]"
                />
              </div>
              <div className="col-span-1 col-start-3 row-start-3">
                <ItemSlot
                  item={null}
                  slotName="Ring 2"
                  className="aspect-square"
                />
              </div>

              {/* Row 4 - Belt */}
              <div className="col-start-2">
                <ItemSlot
                  item={null}
                  slotName="Belt"
                  className="aspect-[2/1]"
                />
              </div>

              {/* Row 5 - Gloves and Boots */}
              <div className="col-span-1 row-start-4 col-start-1">
                <ItemSlot
                  item={null}
                  slotName="Gloves"
                  className="aspect-square"
                />
              </div>
              <div className="col-span-1  row-start-4 col-start-3">
                <ItemSlot
                  item={null}
                  slotName="Boots"
                  className="aspect-square"
                />
              </div>
            </div>

            {/* Right Column - Weapon 2/Shield */}
            <div className="col-span-2">
              <ItemSlot
                item={null}
                slotName="Offhand"
                className="aspect-[1/2]"
              />
            </div>

            {/* Bottom Row - Flasks */}
            <div className="col-span-10 mt-4">
              <div className="grid grid-cols-5 gap-4 max-w-md mx-auto">
                <ItemSlot
                  item={null}
                  slotName="Flask"
                  className="aspect-[1/2]"
                />
                <ItemSlot
                  item={null}
                  slotName="Flask"
                  className="aspect-[1/2]"
                />
                <ItemSlot
                  item={null}
                  slotName="Flask"
                  className="aspect-[1/2]"
                />
                <ItemSlot
                  item={null}
                  slotName="Flask"
                  className="aspect-[1/2]"
                />
                <ItemSlot
                  item={null}
                  slotName="Flask"
                  className="aspect-[1/2]"
                />
              </div>
            </div>
          </div>

          {/* Hover Tooltip Area */}
          {selectedItem && (
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900 border-2 border-amber-600 rounded-lg p-4 shadow-2xl z-50 max-w-md">
              <h3 className="text-amber-400 font-bold text-lg mb-2">
                {selectedItem.name}
              </h3>
              <p className="text-slate-400 text-sm">
                Hover tooltip will appear here when integrated with
                poe-item-hover-react
              </p>
              <p className="text-slate-500 text-xs mt-2">
                Replace this with the actual tooltip component from the library
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
