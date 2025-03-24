import React, { useState } from "react";
import { useEffect } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core"; // drag and collision detection
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"; // modify array order after dnd
import { useSortable } from "@dnd-kit/sortable"; // dnd for individual items
import { CSS } from "@dnd-kit/utilities"; // apply css to dnd items
import "../styles/NewScenario.css";

const Strategy = ({ investments }) => {
  // State to manage form data
  const [formData, setFormData] = useState({
    optimizer: false,
    rothConversionStrat: [],
    rmdStrat: [],
  });
  // for rendering investments to order
  const [rothAccounts, setRothAccounts] = useState([]);
  const [rmdAccounts, setRmdAccounts] = useState([]);

  // update form before sending to server
  useEffect(() => {
    if(formData.optimizer) {
      setFormData((prevData) => ({
        ...prevData,
        rothConversionStrat: rothAccounts,
        rmdStrat: rmdAccounts,
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        rmdStrat: rmdAccounts,
      }));
    }
  }, [rothAccounts, rmdAccounts]);
  
  // send updated settings to server whenever formData updates
  useEffect(() => {
    const updateStrategySettings = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/strategies", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData), // Now it uses the latest formData
        });

        if (response.ok) {
          console.log("Strategy settings updated successfully");
        } else {
          console.error("Failed to update strategy settings");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };
  
      updateStrategySettings();
  }, [formData]); // Now it waits for formData to update before sending to the server

  return (
    <div>
      <h2>Strategies</h2>

      <SpendingStrategy setFormData={setFormData} />
      <p> Enter Expense Withdrawal Strategy </p>
      <RothConversionSettings formData={formData} setFormData={setFormData} 
        rothAccounts={rothAccounts} setRothAccounts={setRothAccounts} investments={investments}/>
      <RMDSettings formData={formData} setFormData={setFormData} rmdAccounts={rmdAccounts}
        setRmdAccounts={setRmdAccounts} investments={investments} rothAccounts={rothAccounts}/>
    </div>
  );
};

export default Strategy;

const RMDSettings = ({ formData, setFormData, rmdAccounts, setRmdAccounts, investments, rothAccounts }) => {

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
        const response = await fetch(`http://localhost:3000/api/investments-pretax`);
        const data = await response.json();
        setRmdAccounts(data);
      } catch (error) {
        console.error('Error fetching pre-tax investments:', error);
      }
    };
    fetchPreTaxInvestments();
  }, [investments]);

  // Drag and drop functionality
  const onDragEnd = (event) => {
    const { active, over } = event;
  
    if (!active || !over) return;
  
    setRmdAccounts((prevRmdAccounts) => {
      const newRmdAccounts = switchOrder(prevRmdAccounts, active.id, over.id);
      return [...newRmdAccounts]; // Ensure new array reference
    });
  };

  const copyOrder = () => {
    setRmdAccounts(rothAccounts);
  }

  return (
    <>
      <h3> RMD Strategy </h3>

      {rmdAccounts && (
        <div>
          <p>To meet required minimum distributions, assets will be transferred out of 
          your pre-tax retirement accounts into after-tax accounts in the following 
          order. <br></br> Drag the investments into your preferred order below:</p>
          {/* Drag and drop mechanism */}
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext key={rmdAccounts.map(a => a.id).join(",")} items={rmdAccounts.map((account) => account.id)} strategy={verticalListSortingStrategy}>

              <ul>
                {rmdAccounts.map((account) => (
                  <SortableItem key={account.id} id={account.id} account={account} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          
        </div>
        
      )}
      {rmdAccounts && formData.optimizer && (
          <button onClick={copyOrder}>Copy order from Roth conversion</button>
      )}

    </>
  )
}

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

// both roth and rmd are ordering on pre tax retirement rothAccounts - share drag and drop component
const RothConversionSettings = ({ formData, setFormData, rothAccounts, setRothAccounts, investments }) => {

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
        const response = await fetch(
          `http://localhost:3000/api/investments-pretax`
        );
        const data = await response.json();
        setRothAccounts(data);
      } catch (error) {
        console.error("Error fetching pre-tax investments:", error);
      }
    };
    fetchPreTaxInvestments();
  }, [investments]);


  useEffect(() => {
    console.log("Updated rothAccounts state:", rothAccounts);
  }, [rothAccounts]);

  // Drag and drop functionality
  const onDragEnd = (event) => {
    const { active, over } = event;

    if (!active || !over) return;
  
    setRothAccounts((prevrothAccounts) => {
      const newrothAccounts = switchOrder(prevrothAccounts, active.id, over.id);
      return [...newrothAccounts]; // Ensure new array reference
    });
  };

  return (
    <>
      {/* Optimizer Settings */}
      <div>
        <div>
            <h3> Roth Conversion Optimizer</h3>
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
      {formData.optimizer && rothAccounts && (
        <div>
          <p>
            Assets will be transferred out of your pre-tax retirement accounts
            into after-tax accounts in the following order. <br></br>
            Drag the investments into your preferred order below:
          </p>
          {/* Drag and drop mechanism? */}
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext key={rothAccounts.map(a => a.id).join(",")} items={rothAccounts.map((account) => account.id)} strategy={verticalListSortingStrategy}>

            
              <ul>
                {rothAccounts.map((account) => (
                  <SortableItem key={account.id} id={account.id} account={account} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </>
  );
};

// individual item for drag and drop
const SortableItem = ({ id, account }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      className="drag"
      style={style}
      {...attributes}
      {...listeners}
    >
      {account.investment_type}: ${account.dollar_value}
    </div>
  );
};

const switchOrder = (items, activeId, overId) => {
  const oldIndex = items.findIndex((item) => item.id === activeId);
  const newIndex = items.findIndex((item) => item.id === overId);

  if (oldIndex === newIndex) return items; // Avoid unnecessary updates

  return arrayMove(items, oldIndex, newIndex); // Return the updated order
};

