import React from "react";

const Receipt = ({ address, date, items, total, cash, change, fatRate, quantity, snfRate }) => {
  return (
    <div className="w-72 bg-white p-4 shadow-lg mx-auto border rounded-md font-mono">
      {/* Header */}
      <div className="text-center border-b pb-2 mb-2">
        <h2 className="text-lg font-semibold">Receipt</h2>
        <p className="text-xs text-gray-600">Address: {address}</p>
        <p className="text-xs">Date: {date}</p>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-2">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span>{item.name}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-b py-2 my-2 text-sm">
        <div className="flex justify-between">
          <span>Fat Rate</span>
          <span>{fatRate?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Quantity(Ltr)</span>
          <span>{quantity?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>SNF Rate</span>
          <span>{snfRate?.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span>Cash</span>
          <span>{cash.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Change</span>
          <span>{change.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Total</span>
          <span>{total.toFixed(2)}</span>
        </div>

      </div>

      {/* Footer */}
      <p className="text-center text-xs my-2">THANK YOU !</p>

      {/* Barcode placeholder */}
      <div className="h-12 w-full bg-[repeating-linear-gradient(to_right,#000_0px,#000_2px,transparent_2px,transparent_4px)]"></div>
    </div>
  );
};

export default Receipt;
