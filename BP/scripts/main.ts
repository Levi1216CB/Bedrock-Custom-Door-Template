import { world, BlockPermutation, ItemStack, Block, PlayerInteractWithBlockBeforeEvent, DimensionLocation, Player, PlayerInteractWithBlockAfterEvent, BlockComponentPlayerDestroyEvent } from '@minecraft/server';


const DoorOpen = {


}

function getPreciseRotation(playerYRotation) {
    if (playerYRotation < 0) playerYRotation += 360;
    //round the degrees into a variable 1 to 8
    const rotation = Math.round(playerYRotation / 45);
    //reset to 0 if over 8
    return rotation !== 8 ? rotation : 0;
}

const RotationBlockComponent = {


}

const DoorComponent = {

    //INTERACTING WITH THE BLOCK

    onPlayerInteract(event) {
        const { block, player } = event;
        const blockOpenState = block.permutation.getState('custom:open');
        const blockUpperState = block.permutation.getState('custom:upper');

        let newOpenState = !blockOpenState;
        let location = block.location;

        //change the block below if the upper block is interacted with
        if (blockUpperState == true) {

            let lowerBlock = world.getDimension("overworld").getBlock({ x: location.x, y: location.y - 1, z: location.z });

            //set states for the block below
            let newLowerPermutation = BlockPermutation.resolve(block.typeId, {
                ...lowerBlock.permutation.getAllStates(),
                'custom:open': newOpenState
            });
            lowerBlock.setPermutation(newLowerPermutation);

        } else
            //change the block above if the bottom block is interacted with
            if (blockUpperState == false) {

                let upperBlock = world.getDimension("overworld").getBlock({ x: location.x, y: location.y + 1, z: location.z });

                //set states for the block above
                let newUpperPermutation = BlockPermutation.resolve(block.typeId, {
                    ...upperBlock.permutation.getAllStates(),
                    'custom:open': newOpenState
                });


                upperBlock.setPermutation(newUpperPermutation);
            }

        //change the block interacted with to toggle states
        let newPermutation = BlockPermutation.resolve(block.typeId, {
            ...block.permutation.getAllStates(),
            'custom:open': newOpenState
        });
        block.setPermutation(newPermutation);

        //play sounds each time the door is interacted with
        if (newOpenState) {
            world.playSound("open.wooden_door", location);
        } else {
            world.playSound("close.wooden_door", location);
        }

    },

    //WHEN PLACING THE BLOCK

    beforeOnPlayerPlace(event) {
        const { block, player } = event;
        const playerYRotation = player.getRotation().y;
        const rotation = getPreciseRotation(playerYRotation);
        const equipment = player.getComponent('equippable');
        const selectedItem = equipment.getEquipment('Mainhand');

        let location = block.location;
        let upperBlockLocation = { x: location.x, y: location.y + 1, z: location.z };
        let cardinal = Math.round(rotation / 2 - 0.5) * 2;

        //set the custom rotation
        event.permutationToPlace = event.permutationToPlace.withState("custom:rotation", cardinal)

        //create upper door with the upper state
        world.getDimension("overworld").runCommand(`/setblock ${upperBlockLocation.x} ${upperBlockLocation.y} ${upperBlockLocation.z} ${selectedItem.typeId}["custom:rotation"=${cardinal},"custom:upper"=true]`)

    },

    //TICKING CHECKS

    onTick(event) {
        const { block } = event;
        const location = block.location;
        const blockUpperState = block.permutation.getState('custom:upper');

        //check for air and destroy iteself
        if (world.getDimension("overworld").getBlock({ x: location.x, y: location.y - 1, z: location.z }).typeId == "minecraft:air" && blockUpperState) {
            world.getDimension("overworld").runCommand(`setblock ${location.x} ${location.y} ${location.z} air`);
        } if (world.getDimension("overworld").getBlock({ x: location.x, y: location.y + 1, z: location.z }).typeId == "minecraft:air" && !blockUpperState) {
            world.getDimension("overworld").runCommand(`setblock ${location.x} ${location.y} ${location.z} air`);
        }
    }


}



world.beforeEvents.worldInitialize.subscribe(({ blockComponentRegistry }) => {

    blockComponentRegistry.registerCustomComponent(
        "custom:door_setup",
        DoorComponent
    );

})