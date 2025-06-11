// import { useState } from "react";

// const ChatInput = ({ onSend }) => {
//   const [text, setText] = useState("");

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (text.trim()) {
//       onSend(text);
//       setText("");
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="flex gap-2">
//       <input
//         value={text}
//         onChange={(e) => setText(e.target.value)}
//         className="flex-1 border p-1"
//         placeholder="메시지를 입력하세요"
//       />
//       <button
//         type="submit"
//         className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
//       >
//         전송
//       </button>
//     </form>
//   );
// };

// export default ChatInput;