/* Basic Reset & Typography */
body {
    font-family: 'Georgia', 'Times New Roman', serif; /* A more "classic" philosophical feel */
    line-height: 1.7;
    margin: 0;
    padding: 0;
    background-color: #fdfdfd; /* Very light grey, almost white */
    color: #222; /* Dark grey for text, not stark black */
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

header {
    text-align: center;
    padding: 40px 20px 20px;
    border-bottom: 1px solid #e0e0e0;
    background-color: #fff;
}

header h1 {
    font-size: 2.5em;
    margin-bottom: 0.2em;
    font-weight: normal;
    color: #1a1a1a;
}

.subtitle {
    font-size: 1.1em;
    color: #555;
    font-style: italic;
}

/* Accordion Container */
.accordion-container {
    max-width: 700px;
    margin: 30px auto;
    padding: 0 20px;
    flex-grow: 1; /* Makes the main content take available space */
}

/* Styling for each <details> element (the "stack") */
details {
    background-color: #fff;
    margin-bottom: 12px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: box-shadow 0.2s ease-in-out;
}

details:hover {
    box-shadow: 0 3px 8px rgba(0,0,0,0.1);
}

/* Styling for the <summary> element (the clickable question) */
summary {
    font-size: 1.2em;
    font-weight: bold;
    padding: 15px 20px;
    cursor: pointer;
    outline: none; /* Removes the default focus outline on some browsers */
    list-style: none; /* Removes the default triangle/marker */
    position: relative; /* For custom marker */
    color: #333;
}

/* Custom marker for open/close state */
summary::before {
    content: '+'; /* Plus sign for closed state */
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.3em;
    font-weight: normal; /* Make the plus/minus less bold than text */
    color: #777;
    transition: transform 0.2s ease-in-out;
}

details[open] summary::before {
    content: '−'; /* Minus sign for open state */
    transform: translateY(-50%) rotate(180deg); /* Optional: animate rotation for minus */
}

/* Styling for the .content div (the answer) */
.content {
    padding: 0px 20px 20px 20px; /* More padding at bottom and sides */
    border-top: 1px dashed #e0e0e0; /* A subtle separator */
    font-size: 1em;
    color: #444;
}

.content p {
    margin-top: 10px;
    margin-bottom: 0;
}

/* Footer */
footer {
    text-align: center;
    padding: 20px;
    font-size: 0.9em;
    color: #666;
    border-top: 1px solid #e0e0e0;
    background-color: #fff;
}

/* Responsive adjustments */
@media (max-width: 600px) {
    header h1 {
        font-size: 2em;
    }
    summary {
        font-size: 1.1em;
    }
    .content {
        font-size: 0.95em;
    }
}
