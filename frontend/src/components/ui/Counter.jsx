import { updateCartItem, removeCartItem } from "@/redux/features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";

const Counter = ({ cartItemId, currentQuantity }) => {
    const dispatch = useDispatch();

    const incrementHandler = () => {
        dispatch(updateCartItem({ id: cartItemId, quantity: currentQuantity + 1 }))
    }

    const decrementHandler = () => {
        if (currentQuantity > 1) {
            dispatch(updateCartItem({ id: cartItemId, quantity: currentQuantity - 1 }))
        } else {
            // If quantity becomes 0, remove the item
            dispatch(removeCartItem(cartItemId))
        }
    }

    return (
        <div className="inline-flex items-center gap-1 sm:gap-3 px-3 py-1 rounded border border-slate-200 max-sm:text-sm text-slate-600">
            <button onClick={decrementHandler} className="p-1 select-none">-</button>
            <p className="p-1">{currentQuantity}</p>
            <button onClick={incrementHandler} className="p-1 select-none">+</button>
        </div>
    )
}

export default Counter