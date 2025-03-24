import React, {useState, useEffect, memo} from 'react';
import yaml from 'js-yaml';
import "../styles/Profile.css";

const UserInfo = ({userData}) => {
    // Needs Profile Picture, Full Name, Email

    return (
        <div className="profile_user_info">
            <img alt="profile picture"></img>
            <h2>{userData.name} {userData.lastName}'s Profile</h2>
            <label>Email</label>
            <p>{userData.email}</p>
        </div>
    );
}

const RenderYAML = memo(() => {
    const [yamlFiles, setYamlFiles] = useState([]);
    // ChatGPT
    /* Prompt
        fileContents should have an array of objects each with buffer and data
        Each file is 100% a yaml file and i want to display all of these yaml files in my html
    */
    useEffect(() => {
        // Fetching YAML files from the server
        console.log("in render yaml use effect");
        fetch("http://localhost:3000/user/download/taxbrackets", {
            method: "GET",
            credentials: "include",  // Sending credentials (cookies, sessions, etc.)
        })
        .then(res => res.json())
        .then((data) => {
            const parsedFiles = data.map((file) => {
                try {
                  // Convert Uint8Array to String
                  const yamlString = new TextDecoder().decode(new Uint8Array(file.content.data));
                  
                  // Parse YAML string into a JavaScript object
                  return {
                    name: file.file_name,
                    content: yaml.load(yamlString), 
                  };
                } catch (error) {
                  console.error("Error parsing YAML:", error);
                  return { name: file.file_name, content: "Error parsing YAML file" };
                }
              });
        
            setYamlFiles((prev) => 
                JSON.stringify(prev) === JSON.stringify(parsedFiles) ? prev : parsedFiles
            );
        })  // Set the parsed data into state
        .catch(err => console.log(err.message));  // Handle any fetch or parsing errors
    }, []);


    // ChatGPT
    return (
        <div>
            {yamlFiles.map((file) => (
                <div key={file.name}>
                <h3>File {file.name}</h3>
                <pre>{JSON.stringify(file.content, null, 2)}</pre>
                </div>
            ))}
        </div>
    );
});

const UserYAML = ({userData}) => {
    const [file, setFile] = useState({name: ""});
    // ChatGPT - Prompt: how can i make the submit button disabled until a file is uploaded
    const handleFileChange = (e) => {
        const uploadedFile = e.target.files[0];
        if (uploadedFile) {
          setFile(uploadedFile);
        } else {
          setFile("");
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (file.name.endsWith(".yaml")) {
            const formData = new FormData();
            formData.append('file', file);
            console.log(file, formData);
            fetch("http://localhost:3000/user/upload/statetax", {
                method: "POST",
                credentials: "include",
                body: formData
            }).then(res => console.log(res.status));
        }
    }

    return (
        <div className="profile_yaml">
            <h2>Uploaded State Tax Rates & Brackets</h2>
            <div className="profile_yaml_content">
                <RenderYAML />
            </div>
            <form className="profile_form" onSubmit={handleSubmit}>
                <label htmlFor="yamlupload">Upload State Tax Rates & Brackets</label>
                <input name="yamlupload" type="file" accept=".yaml" onChange={handleFileChange}></input>
                <button type="submit" disabled={!(file.name.endsWith(".yaml"))}>Upload File</button>
            </form>

        </div>
    )
};

const Profile = () => {
    const [userData, setUserData] = useState({name: "", lastName: "", email: ""});

    useEffect(() => {
        fetch("http://localhost:3000/auth/isAuth", {
        method: "GET",
        credentials: "include",
        })
        .then((res) => res.json())
        .then((data) => {
            console.log("the data", data);
            if (data.email == "") {
                window.location.href = "/dashboard";
            }
            setUserData(data);
        });
    }, []);
    return (
        <div>
            <div className="profile_main_container">
                <div className="profile_left">
                    <UserInfo userData={userData} />
                    <div className="profile_delete">
                        <button id="delete_btn">Delete Account</button>
                    </div>
                </div>
                <div className="profile_right">
                    <UserYAML userData={userData} />
                </div>
            </div>
        </div>
    );
};

export default Profile;