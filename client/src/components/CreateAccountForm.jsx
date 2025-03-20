import React, {useState} from 'react';

export const CreateAccountForm = ({ credential, userData }) => {
    const [formData, setFormData] = useState({
        name: userData.name, lastName: userData.lastName,
    })

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(formData.name, formData.lastName);
        fetch('http://localhost:3000/auth/createAccount', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json', 
            },
            body: JSON.stringify({
              credential: credential,
              name: formData.name,
              lastName: formData.lastName,
            })
          })
          .then((res) => {
            if(res.status == 500) { // Account creation failed, redirect to landing
                window.location.href = '/';
              }
            else if (res.status == 200) { // Logged in
                window.location.href = 'http://localhost:5173/DashboardPage';
            }
            })
          .catch(error => console.error('Error:', error));
    };

    const handleBack = () => {
        window.location.href = "/";
    };

    const handleChange = (e) => {
        console.log(e.target);
        setFormData((prevData) => ({
            ...prevData,
            [e.target.name]: e.target.value,
        }))
    }

    if (credential && userData) {
        return (
            <div class="content">
            <form onSubmit={handleSubmit}>
                <h3>Create Account</h3> {/* I should add a delete btn*/}

                <div>
                    <label>First Name </label>
                    <input type="text" name="name" placeholder="First name" maxLength="60" defaultValue={userData.name} onChange={handleChange} required />
                </div>

                <div>
                    <label>Last Name </label>
                    <input type="text" name="lastName" placeholder="Last name" maxLength="60" defaultValue={userData.lastName} onChange={handleChange} required />
                </div>

                <div>
                    <label>Email</label>
                    <input type="text" name="email" value={userData.email} readOnly disabled />
                </div>
                <div>
                    <button type="button" onClick={handleBack}>Back</button>
                    <button type="submit">Create Account</button>
                </div>
            </form>
            </div>
        );
    }
    else {
        window.location.href = '/';
    }
  };
  
  export default CreateAccountForm;