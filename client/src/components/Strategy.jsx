import React, { useState } from "react";
import { useEffect } from "react";
import { DndContext, closestCenter } from '@dnd-kit/core'; // drag and collision detection
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'; // modify array order after dnd
import { useSortable } from '@dnd-kit/sortable'; // dnd for individual items
import { CSS } from '@dnd-kit/utilities'; // apply css to dnd items

const Strategy = () => {
  // State to manage form data
  const [formData, setFormData] = useState({
    optimizer: false,
    rmd: false,
  });
  // for rendering investments to order
  const [accounts, setAccounts] = useState([]);


  return (
    <div>
      <h2>Spending Strategy</h2>

      <SpendingStrategy setFormData={setFormData} />
      <p> Enter Expense Withdrawal Strategy </p>
      <RothConversionSettings formData={formData} setFormData={setFormData} 
        accounts={accounts} setAccounts={setAccounts}/>
      <p> Optional Enter RMD Strategy </p>
    </div>
  );
};

export default Strategy;

// ordering on discretionary expenses
const SpendingStrategy = ({ setFormData }) => {
  const [expenses, setExpenses] = useState([]);

  // not possible yet ****
  // useEffect(() => {
  //   const fetchExpenses = async () => {
  //     try {
  //       const response = await fetch('http://localhost:3000/api/discretionary-expenses');
  //       const data = await response.json();
  //       setExpenses(data);
  //     } catch (error) {
  //       console.error('Error fetching discretionary expenses:', error);
  //     }
  //   };

  //   fetchExpenses();
  // }, []);

  return (
    <div>
      <p>Enter Spending Strategy</p>
      {/* TODO: Fetch existing discretionary expenses from server */}
      {/* Drag and drop mechanism? */}
    </div>
  );
};

// both roth and rmd are ordering on pre tax retirement accounts - share drag and drop component
const RothConversionSettings = ({ formData, setFormData, accounts, setAccounts }) => {

  const handleOptimizerToggle = () => {
    setFormData((prevData) => ({
      ...prevData,
      optimizer: !prevData.optimizer,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  useEffect(() => {
    const fetchPreTaxInvestments = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/investments-pretax');
        const data = await response.json();
        setAccounts(data);
        console.log('Pre-tax investments:', data);
      } catch (error) {
        console.error('Error fetching pre-tax investments:', error);
      }
    };
    fetchPreTaxInvestments();
  }, [formData]);

  // Drag and drop functionality
  const onDragEnd = (event) => {
    const { active, over } = event;

    if(!active || !over) {
      console.log("No active or over item");
      return;
    }

    if (active.id !== over.id) {
      setAccounts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <>
      {/* Optimizer Settings */}
      <div>
        <div>
            <p> Roth Conversion Optimizer</p>
            <button type="button" onClick={handleOptimizerToggle}>
              {formData.optimizer ? "Disable Optimizer" : "Enable Optimizer"}
            </button>
          </div>
          {formData.optimizer && (
            <div>
              <div>
                <label>Start year:</label>
                <input
                  type="number"
                  name="RothStartYear"
                  placeholder="Enter year"
                  value={formData.RothStartYear || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>End year:</label>
                <input
                  type="number"
                  name="RothEndYear"
                  placeholder="Enter year"
                  value={formData.RothEndYear || ""}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}
      </div>
      
      {/* Ordering Strategy */}
      {formData.optimizer && accounts && (
        <div>
          <p>Assets will be transferred out of your pre-tax retirement accounts into 
            after-tax accounts in the following order. <br></br>
            Drag the investments into your preferred order below:</p>
          {/* Drag and drop mechanism? */}
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={accounts.map((account) => account.id)} strategy={verticalListSortingStrategy}>
              <ul>
                {accounts.map((account) => (
                  <SortableItem key={account.id} id={account.id} account={account} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          
        </div>
      )}
 
    </>
  );
};

// individual item for drag and drop
const SortableItem = ({ id, account }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {account.investment_type}: ${account.dollar_value}
    </li>
  );
};

