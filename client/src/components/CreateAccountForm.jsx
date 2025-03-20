import React from 'react';

export const CreateAccountForm = ({ credential, userData }) => {
    if (credential && userData) {
        return (
            <div class="content">
            <form>
                <h3>Create Account</h3> {/* I should add a delete btn*/}

                <div>
                    <label>First Name </label>
                    <input type="text" name="name" placeholder="Event name" value={userData.name} required />
                </div>

                <div>
                    <label>Last Name </label>
                    <input type="text" name="description" placeholder="Describe your event..." value={userData.lastName} required />
                </div>

                <div>
                    <label>Email</label>
                    <input type="text" name="description" value={userData.email} readOnly disabled />
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